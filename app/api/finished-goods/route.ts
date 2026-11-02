import { NextResponse } from 'next/server'
import { FinishedGoodsService } from '@/lib/services/finished-goods'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cutting_id = searchParams.get('cutting_id') ? parseInt(searchParams.get('cutting_id')!, 10) : undefined
    const seth_id = searchParams.get('seth_id') ? parseInt(searchParams.get('seth_id')!, 10) : undefined
    const status = searchParams.get('status') || undefined
    const size = searchParams.get('size') || undefined
    const search = searchParams.get('search') || undefined

    const items = await FinishedGoodsService.getAll({
      cutting_id,
      seth_id,
      status,
      size,
      search
    })

    return NextResponse.json({ success: true, data: items })
  } catch (err: any) {
    console.error('GET /api/finished-goods error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.cutting_id || !body.size || body.total_pieces === undefined) {
      return NextResponse.json(
        { success: false, detail: 'Missing required fields: cutting_id, size, and total_pieces are required.' },
        { status: 400 }
      )
    }

    const item = await FinishedGoodsService.create({
      cutting_id: parseInt(body.cutting_id, 10),
      seth_id: body.seth_id ? parseInt(body.seth_id, 10) : null,
      lot_number: body.lot_number,
      item_name: body.item_name || 'Denim Jeans',
      size: body.size,
      color_shade: body.color_shade || 'Standard Indigo',
      total_pieces: parseInt(body.total_pieces, 10),
      stitching_pieces: body.stitching_pieces ? parseInt(body.stitching_pieces, 10) : 0,
      finished_pieces: body.finished_pieces ? parseInt(body.finished_pieces, 10) : 0,
      rejected_pieces: body.rejected_pieces ? parseInt(body.rejected_pieces, 10) : 0,
      dispatched_pieces: body.dispatched_pieces ? parseInt(body.dispatched_pieces, 10) : 0,
      status: body.status || 'Cut',
      unit_price: body.unit_price ? parseFloat(body.unit_price) : 0.00,
      dispatch_date: body.dispatch_date || null,
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/finished-goods error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
