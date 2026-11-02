import { NextResponse } from 'next/server'
import { ExpenseService } from '@/lib/services/expenses'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expId = parseInt(id, 10)
    const expense = await ExpenseService.getById(expId)

    if (!expense) {
      return NextResponse.json({ success: false, detail: 'Expense record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: expense })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expId = parseInt(id, 10)
    const body = await request.json()

    if (body.amount !== undefined) body.amount = parseFloat(body.amount)

    const updated = await ExpenseService.update(expId, body)
    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Expense record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expId = parseInt(id, 10)

    const deleted = await ExpenseService.delete(expId)
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Expense record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Expense record deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
