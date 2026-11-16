import { NextRequest, NextResponse } from 'next/server'
import { organizationsService, DEFAULT_ORG_SLUG } from '@/lib/services/organizations'
import { isSuperAdminRequest } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const isSuperAdmin = isSuperAdminRequest(request)
    const cookieStore = await cookies()
    const activeSlug = cookieStore.get('rd_active_org')?.value || DEFAULT_ORG_SLUG

    // Strict Confidentiality:
    // If NOT Super Admin, DO NOT return other organizations.
    // Regular users must have zero idea that other organizations exist.
    if (!isSuperAdmin) {
      const currentOrg = await organizationsService.getOrganizationBySlug(activeSlug)
      return NextResponse.json({
        success: true,
        data: {
          activeSlug,
          currentOrganization: currentOrg
            ? { name: currentOrg.name, slug: currentOrg.slug, database_name: currentOrg.database_name }
            : { name: 'RD Jeans Factory', slug: DEFAULT_ORG_SLUG, database_name: 'rd_jeans_factory' },
          organizations: [], // Hidden from standard users
          isSuperAdmin: false,
        },
      })
    }

    // Only Super Admin can see the master list of all organizations
    const orgs = await organizationsService.getOrganizations()

    return NextResponse.json({
      success: true,
      data: {
        activeSlug,
        organizations: orgs,
        isSuperAdmin: true,
      },
    })
  } catch (error: any) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only Super Admin can create organizations
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json(
        { success: false, detail: 'Access Denied: Only Super Admin can create new organizations.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const newOrg = await organizationsService.createOrganization(body)

    return NextResponse.json({
      success: true,
      data: newOrg,
      message: `Organization "${newOrg.name}" created successfully with dedicated database!`,
    })
  } catch (error: any) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to create organization' },
      { status: 400 }
    )
  }
}
