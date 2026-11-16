import { NextRequest, NextResponse } from 'next/server'
import { organizationsService } from '@/lib/services/organizations'
import { isSuperAdminRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const isSuperAdmin = isSuperAdminRequest(request)

    // Security Guard: Regular users CANNOT switch organizations
    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          detail: 'Access Denied: Only Super Admin can switch workspaces. Regular staff accounts are permanently bound to their assigned factory organization.',
        },
        { status: 403 }
      )
    }

    const { slug } = await request.json()

    if (!slug) {
      return NextResponse.json(
        { success: false, detail: 'Organization slug is required' },
        { status: 400 }
      )
    }

    const org = await organizationsService.getOrganizationBySlug(slug)
    if (!org) {
      return NextResponse.json(
        { success: false, detail: `Organization "${slug}" does not exist` },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: `Active organization switched to "${org.name}"`,
      data: {
        activeSlug: org.slug,
        organizationName: org.name,
        databaseName: org.database_name,
      },
    })

    // Set rd_active_org cookie (valid for 30 days, root path)
    response.cookies.set('rd_active_org', org.slug, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to switch organization' },
      { status: 500 }
    )
  }
}
