import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope')

    if (scope === 'hisab-seth') {
      const result = await GoogleSheetsService.syncModule('hisab-seth')
      return NextResponse.json(result)
    }

    // Default: full factory sync across all 12 modules into separate sheet tabs
    const result = await GoogleSheetsService.syncAllFactory()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('POST /api/google-sheets/sync-all error:', err)
    return NextResponse.json(
      { success: false, total_sheets: 0, total_rows: 0, message: err.message || 'Factory sync failed' },
      { status: 500 }
    )
  }
}
