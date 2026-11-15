import { NextRequest, NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'
import ExcelJS from 'exceljs'

// GET: Returns the sample CSV template for import
export async function GET() {
  const template = SethHisabService.getSampleTemplateCsv()
  return new Response(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="seth_hisab_import_template.csv"',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

// POST: Imports records from JSON array or file upload
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let records: any[] = []

    if (contentType.includes('application/json')) {
      const body = await request.json()
      records = Array.isArray(body) ? body : (body.records || [])
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ success: false, detail: 'No file provided' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = file.name.toLowerCase()

      if (filename.endsWith('.csv')) {
        const text = buffer.toString('utf-8')
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
        if (lines.length <= 1) {
          return NextResponse.json({ success: false, detail: 'CSV file contains no data rows' }, { status: 400 })
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[\s_]+/g, ''))

        for (let i = 1; i < lines.length; i++) {
          const cells = parseCsvLine(lines[i])
          const obj: any = {}
          headers.forEach((h, idx) => {
            const val = cells[idx] || ''
            if (h.includes('seth')) obj.seth_name = val
            else if (h.includes('date')) obj.hisab_date = val
            else if (h.includes('lot')) obj.lot_number = val
            else if (h.includes('roll')) obj.roll_number = val
            else if (h.includes('fabric')) obj.fabric_type = val
            else if (h.includes('piece')) obj.pieces = val
            else if (h.includes('meter')) obj.meter_used = val
            else if (h.includes('rate')) obj.rate_per_piece = val
            else if (h.includes('extra') && !h.includes('note')) obj.extra_charges = val
            else if (h.includes('extra') && h.includes('note')) obj.extra_charges_notes = val
            else if (h.includes('deduct') && !h.includes('note')) obj.deductions = val
            else if (h.includes('deduct') && h.includes('note')) obj.deductions_notes = val
            else if (h.includes('paid')) obj.paid_amount = val
            else if (h.includes('method')) obj.payment_method = val
            else if (h.includes('handled')) obj.handled_by = val
            else if (h.includes('note')) obj.notes = val
          })
          if (obj.seth_name) records.push(obj)
        }
      } else {
        // Parse Excel workbook
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as any)
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          return NextResponse.json({ success: false, detail: 'Excel file is empty' }, { status: 400 })
        }

        const headerRow = worksheet.getRow(1)
        const headers: string[] = []
        headerRow.eachCell((cell, colNum) => {
          headers[colNum] = String(cell.value || '').trim().toLowerCase().replace(/[\s_]+/g, '')
        })

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return
          const obj: any = {}
          row.eachCell((cell, colNum) => {
            const h = headers[colNum] || ''
            const val = cell.value ? String(cell.value).trim() : ''
            if (h.includes('seth')) obj.seth_name = val
            else if (h.includes('date')) obj.hisab_date = val
            else if (h.includes('lot')) obj.lot_number = val
            else if (h.includes('roll')) obj.roll_number = val
            else if (h.includes('fabric')) obj.fabric_type = val
            else if (h.includes('piece')) obj.pieces = val
            else if (h.includes('meter')) obj.meter_used = val
            else if (h.includes('rate')) obj.rate_per_piece = val
            else if (h.includes('extra') && !h.includes('note')) obj.extra_charges = val
            else if (h.includes('extra') && h.includes('note')) obj.extra_charges_notes = val
            else if (h.includes('deduct') && !h.includes('note')) obj.deductions = val
            else if (h.includes('deduct') && h.includes('note')) obj.deductions_notes = val
            else if (h.includes('paid')) obj.paid_amount = val
            else if (h.includes('method')) obj.payment_method = val
            else if (h.includes('handled')) obj.handled_by = val
            else if (h.includes('note')) obj.notes = val
          })
          if (obj.seth_name) records.push(obj)
        })
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ success: false, detail: 'No valid records found in import payload' }, { status: 400 })
    }

    const result = await SethHisabService.importData(records)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('POST /api/hisab-seth/import error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Error processing import' },
      { status: 500 }
    )
  }
}

// Simple CSV line parser respecting quoted strings
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}
