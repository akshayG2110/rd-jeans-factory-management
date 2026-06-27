import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userCookie = request.cookies.get("rd_user")

  // Exclude assets, public files, auth login APIs, or standard internal _next paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // image files, icons, etc.
  ) {
    return NextResponse.next()
  }

  // Not logged in -> Redirect to login if trying to access pages
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

// Apply middleware to all routes except public paths and resources
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
