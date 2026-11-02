import { NextResponse } from 'next/server'
import { CuttingService } from '@/lib/services/cutting'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cutId = parseInt(id, 10)
    const cutting = await CuttingService.getById(cutId)

    if (!cutting) {
      return NextResponse.json({ detail: 'Cutting entry not found' }, { status: 404 })
    }

    return NextResponse.json(cutting)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cutId = parseInt(id, 10)
    const body = await request.json()

    if (body.roll_id) body.roll_id = parseInt(body.roll_id, 10)
    if (body.employee_id !== undefined) {
      body.employee_id = body.employee_id ? parseInt(body.employee_id, 10) : null
    } else if (body.worker_id !== undefined) {
      body.employee_id = body.worker_id ? parseInt(body.worker_id, 10) : null
    }
    if (body.meter_used !== undefined) body.meter_used = parseFloat(body.meter_used)
    if (body.piece_count !== undefined) body.piece_count = parseInt(body.piece_count, 10)
    if (body.pana !== undefined && body.pana !== null) body.pana = parseFloat(body.pana)
    if (body.average !== undefined && body.average !== null) body.average = parseFloat(body.average)

    const updated = await CuttingService.update(cutId, body)
    if (!updated) {
      return NextResponse.json({ detail: 'Cutting entry not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cutId = parseInt(id, 10)

    const deleted = await CuttingService.delete(cutId)
    if (!deleted) {
      return NextResponse.json({ detail: 'Cutting entry not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Cutting entry deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}
