import { NextRequest, NextResponse } from 'next/server'
import { organizationsService } from '@/lib/services/organizations'
import { isSuperAdminRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const org = await organizationsService.getOrganizationBySlug(slug)

    if (!org) {
      return NextResponse.json(
        { success: false, detail: `Organization "${slug}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: org,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Error fetching organization' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json(
        { success: false, detail: 'Access Denied: Only Super Admin can modify organizations.' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const body = await request.json()
    const updated = await organizationsService.updateOrganization(slug, body)

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Organization "${slug}" updated successfully`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to update organization' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!isSuperAdminRequest(request)) {
      return NextResponse.json(
        { success: false, detail: 'Access Denied: Only Super Admin can delete organizations.' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const success = await organizationsService.deleteOrganization(slug)

    if (!success) {
      return NextResponse.json(
        { success: false, detail: `Organization "${slug}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Organization "${slug}" and its database have been removed.`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: error.message || 'Failed to delete organization' },
      { status: 400 }
    )
  }
}
