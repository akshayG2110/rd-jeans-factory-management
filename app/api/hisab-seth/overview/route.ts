import { NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sethIdParam = searchParams.get('seth_id')
    const sethId = sethIdParam ? Number(sethIdParam) : undefined

    const overview = await SethHisabService.getWorkOverview(sethId)
    return NextResponse.json({ success: true, data: overview })
  } catch (err: any) {
    console.error('GET /api/hisab-seth/overview error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error loading work overview' },
      { status: 500 }
    )
  }
}
