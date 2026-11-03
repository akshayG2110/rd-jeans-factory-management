const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlStr = typeof input === "string" ? input : (input as any).url || String(input)

  // Normalize legacy Python backend URLs (e.g. http://localhost:8000/employees -> /api/employees)
  if (urlStr.includes("localhost:8000") || urlStr.includes("127.0.0.1:8000")) {
    urlStr = urlStr.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, "/api")
  }

  // Construct target API URL
  let targetUrl = urlStr
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    if (urlStr.startsWith("/api")) {
      targetUrl = urlStr
    } else if (urlStr.startsWith("/")) {
      targetUrl = `${API_BASE}${urlStr}`
    } else {
      targetUrl = `${API_BASE}/${urlStr}`
    }
  }

  // Inject headers
  const headers = new Headers(init?.headers)

  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("rd_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.token && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${user.token}`)
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
  }

  try {
    const response = await fetch(targetUrl, { ...init, headers })

    if (response.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("rd_user")
        document.cookie = "rd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "rd_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        window.location.href = "/login?error=session_expired"
      }
    }

    return response
  } catch (err: any) {
    console.error("apiFetch network exception details:", err)
    let errorDetail = "Network connection failed. Please check your connection."
    const errMsg = String(err.message || "").toLowerCase()

    if (errMsg.includes("failed to fetch") || errMsg.includes("load failed")) {
      errorDetail = "The API server is unreachable. Please verify your connection."
    }

    throw new Error(errorDetail)
  }
}
