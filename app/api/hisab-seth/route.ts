import { NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sethIdParam = searchParams.get('seth_id')
    const seth_id = sethIdParam ? Number(sethIdParam) : undefined
    const payment_status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const hisabs = await SethHisabService.getAll({ seth_id, payment_status, search })
    return NextResponse.json({ success: true, data: hisabs })
  } catch (err: any) {
    console.error('GET /api/hisab-seth error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error loading Seth Hisab records' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.seth_id) {
      return NextResponse.json({ success: false, detail: 'Please select a Seth client' }, { status: 400 })
    }

    if (!body.lots || body.lots.length === 0) {
      return NextResponse.json({ success: false, detail: 'Please select at least one completed cutting lot' }, { status: 400 })
    }

    const created = await SethHisabService.create(body)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/hisab-seth error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error generating Seth Hisab' },
      { status: 400 }
    )
  }
}
