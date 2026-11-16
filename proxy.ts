import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.SECRET_KEY || process.env.JWT_SECRET || "e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1"
const encodedSecret = new TextEncoder().encode(JWT_SECRET)

// Public API endpoints that do NOT require an authentication token
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/health",
  "/api/super-admin/auth/login",
  "/api/super-admin/visibility"
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip Next.js internal paths and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp")
  ) {
    return NextResponse.next()
  }

  // 2. Allow Public API Endpoints
  const isPublicApi = PUBLIC_API_PATHS.some(
    publicPath => pathname === publicPath || pathname.startsWith(publicPath + "/")
  )
  if (isPublicApi) {
    return NextResponse.next()
  }

  // Extract Auth Token from Authorization header or cookies
  let token = ""
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim()
  }

  if (!token) {
    token = request.cookies.get("rd_token")?.value || request.cookies.get("super_admin_token")?.value || ""
  }

  // 3. API Routes Auth Guard (/api/*)
  if (pathname.startsWith("/api")) {
    let payload: any = null

    if (token) {
      try {
        const verified = await jwtVerify(token, encodedSecret)
        payload = verified.payload
      } catch (err) {
        // Token verification failed or expired
        payload = null
      }
    }

    // Fallback: If rd_user cookie is present for browser requests
    if (!payload) {
      const userCookie = request.cookies.get("rd_user")?.value
      if (userCookie && process.env.NODE_ENV !== "production") {
        // Allow session during dev if rd_user cookie exists
        payload = { sub: userCookie, id: 1 }
      }
    }

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          detail: "Unauthorized: Access token is missing, invalid, or expired."
        },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Bearer error="invalid_token"'
          }
        }
      )
    }

    // Token is valid: Inject authenticated user identity into downstream headers
    const requestHeaders = new Headers(request.headers)
    if (payload.sub) {
      requestHeaders.set("x-user-name", String(payload.sub))
    }
    if (payload.id) {
      requestHeaders.set("x-user-id", String(payload.id))
    }
    if (payload.role) {
      requestHeaders.set("x-user-role", String(payload.role))
    }

    // Strict Tenant Isolation Guard:
    // Regular users are strictly locked to their assigned organization (prevent tampering/jumping)
    const isSuper = payload.role === "SuperAdmin"
    let activeOrg = "rd-jeans-main"
    if (!isSuper && payload.org_slug) {
      activeOrg = String(payload.org_slug)
    } else {
      activeOrg = request.cookies.get("rd_active_org")?.value || (payload.org_slug || "rd-jeans-main")
    }
    requestHeaders.set("x-tenant-org", activeOrg)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // 4. Web Page Routes Auth Guard (UI Pages)
  // Super Admin portal pages handle their own authentication at /super-admin/login
  if (pathname.startsWith("/super-admin") || pathname === "/admin") {
    return NextResponse.next()
  }

  const userCookie = request.cookies.get("rd_user")?.value || request.cookies.get("rd_token")?.value

  // When visiting /login
  if (pathname === "/login") {
    const searchParams = request.nextUrl.searchParams
    // If error or logout is requested, clear session cookies and display login page
    if (searchParams.has("error") || searchParams.has("logout")) {
      const response = NextResponse.next()
      response.cookies.delete("rd_user")
      response.cookies.delete("rd_token")
      return response
    }

    // If authenticated user visits /login, redirect to destination or dashboard
    if (userCookie) {
      const fromParam = searchParams.get("from")
      const targetPath = fromParam && fromParam.startsWith("/") ? fromParam : "/"
      const redirectUrl = new URL(targetPath, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Unauthenticated user can view /login
    return NextResponse.next()
  }

  // Protected pages: Not logged in -> Redirect to /login
  if (!userCookie) {
    const loginUrl = new URL("/login", request.url)
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("from", pathname + (request.nextUrl.search || ""))
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Backward-compatibility alias
export const middleware = proxy
export default proxy

// Intercept all routes except static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
