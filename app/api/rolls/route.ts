import { NextResponse } from 'next/server'
import { RollService } from '@/lib/services/rolls'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seth_id = searchParams.get('seth_id') ? parseInt(searchParams.get('seth_id')!, 10) : undefined
    const fabric_type = searchParams.get('fabric_type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const rolls = await RollService.getAll({
      seth_id,
      fabric_type,
      status,
      search
    })
    return NextResponse.json({ success: true, data: rolls })
  } catch (err: any) {
    console.error('GET /api/rolls error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.seth_id || !body.entry_date || !body.roll_number || !body.short_number || !body.fabric_type || body.received_meter === undefined) {
      return NextResponse.json({ success: false, detail: 'Missing required roll fields' }, { status: 400 })
    }

    const roll = await RollService.create({
      seth_id: parseInt(body.seth_id, 10),
      entry_date: body.entry_date,
      roll_number: body.roll_number,
      short_number: body.short_number,
      fabric_type: body.fabric_type,
      received_meter: parseFloat(body.received_meter),
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: roll }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/rolls error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
