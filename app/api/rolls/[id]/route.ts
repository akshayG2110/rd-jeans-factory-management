import { NextResponse } from 'next/server'
import { RollService } from '@/lib/services/rolls'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rollId = parseInt(id, 10)
    const roll = await RollService.getById(rollId)

    if (!roll) {
      return NextResponse.json({ detail: 'Roll not found' }, { status: 404 })
    }

    return NextResponse.json(roll)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rollId = parseInt(id, 10)
    const body = await request.json()

    if (body.seth_id) body.seth_id = parseInt(body.seth_id, 10)
    if (body.received_meter !== undefined) body.received_meter = parseFloat(body.received_meter)

    const updated = await RollService.update(rollId, body)
    if (!updated) {
      return NextResponse.json({ detail: 'Roll not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rollId = parseInt(id, 10)

    const deleted = await RollService.delete(rollId)
    if (!deleted) {
      return NextResponse.json({ detail: 'Roll not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Roll deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}
