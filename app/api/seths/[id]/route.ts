import { NextResponse } from 'next/server'
import { SethService } from '@/lib/services/seths'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sethId = parseInt(id, 10)
    const seth = await SethService.getById(sethId)

    if (!seth) {
      return NextResponse.json({ detail: 'Seth client not found' }, { status: 404 })
    }

    return NextResponse.json(seth)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sethId = parseInt(id, 10)
    const body = await request.json()

    const updated = await SethService.update(sethId, body)
    if (!updated) {
      return NextResponse.json({ detail: 'Seth client not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sethId = parseInt(id, 10)

    const deleted = await SethService.delete(sethId)
    if (!deleted) {
      return NextResponse.json({ detail: 'Seth client not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Seth client deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}
