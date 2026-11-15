import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let moduleKey = searchParams.get('module')

    if (!moduleKey) {
      const body = await request.json().catch(() => ({}))
      moduleKey = body.module
    }

    if (!moduleKey) {
      return NextResponse.json(
        { success: false, message: 'Module key is required (e.g., employees, cutting, cashbook)' },
        { status: 400 }
      )
    }

    const result = await GoogleSheetsService.syncModule(moduleKey)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('POST /api/google-sheets/sync-module error:', err)
    return NextResponse.json(
      { success: false, count: 0, message: err.message || 'Module sync failed' },
      { status: 500 }
    )
  }
}
