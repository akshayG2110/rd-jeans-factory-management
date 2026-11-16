import { NextRequest, NextResponse } from 'next/server'
import { organizationsService } from '@/lib/services/organizations'
import { isSuperAdminRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json(
        { success: false, detail: 'Access Denied: Only Super Admin can export database backups.' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const backup = await organizationsService.createTenantBackup(slug)

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `tenant-${slug}-backup-${dateStr}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to generate tenant backup' },
      { status: 500 }
    )
  }
}
