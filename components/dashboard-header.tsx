"use client"

import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    const now = new Date()
    setDateStr(
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    )
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("rd_user")
    document.cookie = "rd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "rd_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = "/login?logout=true"
  }

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground">
          RD
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">RD Jeans Factory</h1>
          <p className="text-sm text-muted-foreground font-medium">Factory Management System</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-right text-[11px] font-semibold text-muted-foreground">
          {dateStr}
        </p>
        <button
          onClick={handleLogout}
          className="rounded-full bg-secondary hover:bg-muted px-3 py-1 text-[10px] font-extrabold text-foreground ring-1 ring-border transition-all active:scale-95"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
