import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'

export async function GET() {
  try {
    const settings = await GoogleSheetsService.getSettings()
    const scriptCode = GoogleSheetsService.getGoogleAppsScriptCode()
    const counts = await GoogleSheetsService.getCounts()

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        script_code: scriptCode,
        counts
      }
    })
  } catch (err: any) {
    console.error('GET /api/google-sheets error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Error fetching Google Sheets settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = await GoogleSheetsService.saveSettings(body)

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('POST /api/google-sheets error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Error saving settings' },
      { status: 400 }
    )
  }
}
