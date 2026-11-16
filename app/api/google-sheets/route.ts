import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'
import { organizationsService, DEFAULT_ORG_SLUG } from '@/lib/services/organizations'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const settings = await GoogleSheetsService.getSettings()
    const scriptCode = GoogleSheetsService.getGoogleAppsScriptCode()
    const counts = await GoogleSheetsService.getCounts()

    const cookieStore = await cookies()
    const activeSlug = cookieStore.get('rd_active_org')?.value || DEFAULT_ORG_SLUG
    const org = await organizationsService.getOrganizationBySlug(activeSlug)

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        organization: {
          name: org?.name || 'DenimFlow Factory',
          slug: org?.slug || DEFAULT_ORG_SLUG,
          database_name: org?.database_name || 'rd_jeans_factory',
        },
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
