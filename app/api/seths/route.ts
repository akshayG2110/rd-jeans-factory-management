import { NextResponse } from 'next/server'
import { SethService } from '@/lib/services/seths'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const seths = await SethService.getAll(search, status)
    return NextResponse.json({ success: true, data: seths })
  } catch (err: any) {
    console.error('GET /api/seths error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.seth_name) {
      return NextResponse.json({ success: false, detail: 'Missing required seth_name field' }, { status: 400 })
    }

    const seth = await SethService.create(body)
    return NextResponse.json({ success: true, data: seth }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/seths error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
