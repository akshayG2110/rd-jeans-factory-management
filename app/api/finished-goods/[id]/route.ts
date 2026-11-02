import { NextResponse } from 'next/server'
import { FinishedGoodsService } from '@/lib/services/finished-goods'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await FinishedGoodsService.getById(parseInt(id, 10))

    if (!item) {
      return NextResponse.json({ success: false, detail: 'Finished goods item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: item })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await FinishedGoodsService.update(parseInt(id, 10), {
      seth_id: body.seth_id !== undefined ? (body.seth_id ? parseInt(body.seth_id, 10) : null) : undefined,
      item_name: body.item_name,
      size: body.size,
      color_shade: body.color_shade,
      total_pieces: body.total_pieces !== undefined ? parseInt(body.total_pieces, 10) : undefined,
      stitching_pieces: body.stitching_pieces !== undefined ? parseInt(body.stitching_pieces, 10) : undefined,
      finished_pieces: body.finished_pieces !== undefined ? parseInt(body.finished_pieces, 10) : undefined,
      rejected_pieces: body.rejected_pieces !== undefined ? parseInt(body.rejected_pieces, 10) : undefined,
      dispatched_pieces: body.dispatched_pieces !== undefined ? parseInt(body.dispatched_pieces, 10) : undefined,
      status: body.status,
      unit_price: body.unit_price !== undefined ? parseFloat(body.unit_price) : undefined,
      dispatch_date: body.dispatch_date !== undefined ? body.dispatch_date : undefined,
      notes: body.notes !== undefined ? body.notes : undefined
    })

    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Finished goods item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = await FinishedGoodsService.delete(parseInt(id, 10))

    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Finished goods item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Finished goods item deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
