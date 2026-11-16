"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/super-admin")
  }, [router])

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-xs font-bold text-slate-400">Redirecting to Super Admin...</span>
      </div>
    </main>
  )
}
