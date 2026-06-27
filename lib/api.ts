const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : (input as any).url || String(input)
  
  // Construct absolute URL for backend API requests
  const targetUrl = urlStr.startsWith("http") ? urlStr : `${API_BASE}${urlStr.startsWith("/") ? "" : "/"}${urlStr}`

  // Clone headers dictionary
  const headers = new Headers(init?.headers)

  // Inject Bearer Token
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("rd_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.token) {
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${user.token}`)
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  try {
    const response = await fetch(targetUrl, { ...init, headers })
    
    // Auto redirection to login if backend returns 401 Unauthorized
    if (response.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("rd_user")
        document.cookie = "rd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        window.location.href = "/login?error=session_expired"
      }
    }
    
    return response
  } catch (err: any) {
    console.error("apiFetch network exception details:", err)
    
    let errorDetail = "Network connection failed. Please check your network adapters."
    const errMsg = String(err.message || "").toLowerCase()
    
    if (errMsg.includes("failed to fetch") || errMsg.includes("load failed")) {
      errorDetail = "The backend server is offline or unreachable. Please verify it is running on port 8000."
    }
    
    throw new Error(errorDetail)
  }
}
