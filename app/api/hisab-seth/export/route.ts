import { NextRequest, NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const sethIdParam = searchParams.get('seth_id')
    const seth_id = sethIdParam ? Number(sethIdParam) : undefined
    const payment_status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'csv') {
      const csvContent = await SethHisabService.exportCsv({ seth_id, payment_status, search })
      const filename = `Seth_Hisab_Export_${dateStr}.csv`
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // Default to Excel (.xlsx)
    const buffer = await SethHisabService.exportExcel({ seth_id, payment_status, search })
    const filename = `RD_Jeans_Seth_Hisab_${dateStr}.xlsx`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (err: any) {
    console.error('GET /api/hisab-seth/export error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Error exporting Hisab data' },
      { status: 500 }
    )
  }
}
