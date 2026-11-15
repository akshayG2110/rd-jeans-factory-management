import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await GoogleSheetsService.testConnection(body.webhook_url)

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('POST /api/google-sheets/test error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
