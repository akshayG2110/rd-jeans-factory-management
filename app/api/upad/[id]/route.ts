import { NextResponse } from 'next/server'
import { UpadService } from '@/lib/services/upad'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const upadId = parseInt(id, 10)
    const upad = await UpadService.getById(upadId)

    if (!upad) {
      return NextResponse.json({ success: false, detail: 'Upad record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: upad })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const upadId = parseInt(id, 10)
    const body = await request.json()

    if (body.employee_id) body.employee_id = parseInt(body.employee_id, 10)
    if (body.amount !== undefined) body.amount = parseFloat(body.amount)

    const updated = await UpadService.update(upadId, body)
    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Upad record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const upadId = parseInt(id, 10)

    const deleted = await UpadService.delete(upadId)
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Upad record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Upad record deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
