import { NextResponse } from 'next/server'
import { getMongoClient } from '@/lib/mongodb'
import { verifyPassword, generateToken, ensureDefaultUser } from '@/lib/auth'
import { organizationsService } from '@/lib/services/organizations'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, detail: 'Username and password are required' }, { status: 400 })
    }

    // 1. Resolve which tenant database this user belongs to
    const userOrgContext = await organizationsService.lookupUserOrg(username)
    const targetDbName = userOrgContext?.database_name || 'rd_jeans_factory'
    const orgSlug = userOrgContext?.org_slug || 'rd-jeans-main'

    const client = await getMongoClient()
    const db = client.db(targetDbName)
    let user = await db.collection('users').findOne({ username })

    // Only attempt default user seed if users collection is completely empty in primary database
    if (!user && targetDbName === 'rd_jeans_factory') {
      const userCount = await db.collection('users').countDocuments()
      if (userCount === 0) {
        await ensureDefaultUser()
        user = await db.collection('users').findOne({ username })
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, detail: 'Invalid username or password' }, { status: 401 })
    }

    // 2. Check if the user's organization workspace is deactivated
    const org = await organizationsService.getOrganizationBySlug(orgSlug)
    if (org && org.status === 'Inactive') {
      return NextResponse.json({
        success: false,
        detail: `This factory organization workspace (${org.name}) has been deactivated by Super Admin. Please contact administrator.`
      }, { status: 403 })
    }

    // 3. Check if staff account itself is deactivated
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return NextResponse.json({
        success: false,
        detail: 'This staff account has been deactivated by Super Admin. Please contact your factory administrator.'
      }, { status: 403 })
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ success: false, detail: 'Invalid username or password' }, { status: 401 })
    }

    // Embed assigned organization into the JWT token
    const token = generateToken({
      sub: user.username,
      id: user.id,
      role: user.role || 'Operator',
      org_slug: orgSlug
    })

    const response = NextResponse.json({
      success: true,
      access_token: token,
      token_type: 'bearer',
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role || 'Operator', org_slug: orgSlug, token }
    })

    // Set cookies for middleware authentication & pin active organization
    response.cookies.set('rd_user', user.username, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    })

    response.cookies.set('rd_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    })

    response.cookies.set('rd_active_org', orgSlug, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400 // 30 days
    })

    return response
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Internal server error' }, { status: 500 })
  }
}
