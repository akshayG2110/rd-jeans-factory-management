import { NextResponse } from 'next/server'
import { IncomeService } from '@/lib/services/income'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const incId = parseInt(id, 10)
    const income = await IncomeService.getById(incId)

    if (!income) {
      return NextResponse.json({ success: false, detail: 'Income record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: income })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const incId = parseInt(id, 10)
    const body = await request.json()

    if (body.amount !== undefined) body.amount = parseFloat(body.amount)

    const updated = await IncomeService.update(incId, body)
    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Income record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const incId = parseInt(id, 10)

    const deleted = await IncomeService.delete(incId)
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Income record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Income record deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
