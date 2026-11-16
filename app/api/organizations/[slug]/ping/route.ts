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
        { success: false, detail: 'Access Denied: Only Super Admin can ping tenant databases.' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const result = await organizationsService.pingTenant(slug)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Ping failed' },
      { status: 500 }
    )
  }
}
