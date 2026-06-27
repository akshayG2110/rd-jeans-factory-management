"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem("rd_user")
      const isLoginPage = pathname === "/login"

      if (!userStr && !isLoginPage) {
        // Not authenticated, send to login
        router.replace("/login")
      } else if (userStr && isLoginPage) {
        // Authenticated, redirect away from login page
        router.replace("/")
      } else {
        setLoading(false)
      }
    }

    checkAuth()
    
    // Add event listener to capture storage changes (logout)
    window.addEventListener("storage", checkAuth)
    return () => {
      window.removeEventListener("storage", checkAuth)
    }
  }, [pathname, router])

  if (loading && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground mt-2">Authenticating Session...</p>
      </div>
    )
  }

  return <>{children}</>
}
