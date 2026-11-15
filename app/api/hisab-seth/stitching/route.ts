import { NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.cutting_id) {
      return NextResponse.json({ success: false, detail: 'Missing cutting_id' }, { status: 400 })
    }

    const status = body.status || 'Ready'
    const res = await SethHisabService.updateStitchingStatus(Number(body.cutting_id), status)
    return NextResponse.json({ success: true, data: res })
  } catch (err: any) {
    console.error('POST /api/hisab-seth/stitching error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error updating stitching status' },
      { status: 400 }
    )
  }
}
