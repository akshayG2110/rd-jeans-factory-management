"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    const isLoginPage = pathname === "/login"
    const userStr = localStorage.getItem("rd_user")
    const hasCookie = document.cookie.includes("rd_user=") || document.cookie.includes("rd_token=")

    if (isLoginPage) {
      // If we are on the login page and do not have active session cookies,
      // clear any stale or lingering localStorage so it never triggers bounces or loops
      if (!hasCookie && userStr) {
        localStorage.removeItem("rd_user")
      }
    } else {
      // On protected pages:
      // If cookies exist but localStorage was cleared, heal localStorage
      if (!userStr && hasCookie) {
        const match = document.cookie.match(/rd_user=([^;]+)/)
        const username = match ? decodeURIComponent(match[1]) : "rdjeans123"
        localStorage.setItem("rd_user", JSON.stringify({ username }))
      }
    }

    // Capture logout events triggered across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rd_user" && !e.newValue && pathname !== "/login") {
        router.replace("/login?logout=true")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [pathname, router])

  return <>{children}</>
}
