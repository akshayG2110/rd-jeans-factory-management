import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.SECRET_KEY || process.env.JWT_SECRET || "e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1"
const encodedSecret = new TextEncoder().encode(JWT_SECRET)

// Public API endpoints that do NOT require an authentication token
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/health"
]

export async function middleware(request: NextRequest) {
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
    token = request.cookies.get("rd_token")?.value || ""
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

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // 4. Web Page Routes Auth Guard (UI Pages)
  const userCookie = request.cookies.get("rd_user")?.value || request.cookies.get("rd_token")?.value

  // Not logged in -> Redirect to /login
  if (!userCookie && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in + visiting /login -> Redirect to dashboard (/)
  if (userCookie && pathname === "/login") {
    const dashboardUrl = new URL("/", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// Intercept all routes except static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
