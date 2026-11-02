import { NextResponse } from 'next/server'
import { CuttingService } from '@/lib/services/cutting'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roll_id = searchParams.get('roll_id') ? parseInt(searchParams.get('roll_id')!, 10) : undefined
    const employee_id = searchParams.get('employee_id')
      ? parseInt(searchParams.get('employee_id')!, 10)
      : searchParams.get('worker_id')
      ? parseInt(searchParams.get('worker_id')!, 10)
      : undefined
    const size = searchParams.get('size') || undefined
    const sort_number = searchParams.get('sort_number') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const search = searchParams.get('search') || undefined

    const cuttings = await CuttingService.getAll({
      roll_id,
      employee_id,
      size,
      sort_number,
      date_from,
      date_to,
      search
    })
    return NextResponse.json({ success: true, data: cuttings })
  } catch (err: any) {
    console.error('GET /api/cutting error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.cutting_date || !body.lot_number || !body.roll_id || body.meter_used === undefined || body.piece_count === undefined || !body.size) {
      return NextResponse.json({ success: false, detail: 'Missing required cutting fields' }, { status: 400 })
    }

    const employee_id = body.employee_id !== undefined && body.employee_id !== null && body.employee_id !== ""
      ? parseInt(body.employee_id, 10)
      : body.worker_id !== undefined && body.worker_id !== null && body.worker_id !== ""
      ? parseInt(body.worker_id, 10)
      : null

    const cutting = await CuttingService.create({
      cutting_date: body.cutting_date,
      lot_number: body.lot_number,
      roll_id: parseInt(body.roll_id, 10),
      employee_id,
      meter_used: parseFloat(body.meter_used),
      layer_information: body.layer_information || null,
      piece_count: parseInt(body.piece_count, 10),
      size: body.size,
      pana: body.pana !== undefined && body.pana !== null ? parseFloat(body.pana) : null,
      average: body.average !== undefined && body.average !== null ? parseFloat(body.average) : null,
      sort_number: body.sort_number || null,
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: cutting }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/cutting error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
