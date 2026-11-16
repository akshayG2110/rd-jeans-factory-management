"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cloud } from "lucide-react"

export function DashboardHeader() {
  const [dateStr, setDateStr] = useState("")
  const [currentOrgName, setCurrentOrgName] = useState<string>("DenimFlow ERP")

  useEffect(() => {
    const now = new Date()
    setDateStr(
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    )

    // Load active factory branding cleanly (Zero leakage of other organizations)
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.currentOrganization?.name) {
          setCurrentOrgName(json.data.currentOrganization.name)
        }
      })
      .catch((err) => console.error("Failed to load factory header:", err))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("rd_user")
    document.cookie = "rd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "rd_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = "/login?logout=true"
  }

  return (
    <header className="flex items-start justify-between gap-3 sm:gap-4">
      {/* Left: Factory Branding (Static, 100% Private - No switcher, no list of other organizations) */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-xs ring-2 ring-primary/20">
          {currentOrgName ? currentOrgName.slice(0, 2).toUpperCase() : "DF"}
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold leading-tight text-foreground truncate">
            {currentOrgName}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <p className="text-xs text-muted-foreground font-medium truncate">
              DenimFlow Factory Management OS
            </p>
          </div>
        </div>
      </div>

      {/* Right: Date, Sheets & Logout */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-right text-[11px] font-semibold text-muted-foreground hidden sm:block">
          {dateStr}
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            href="/google-sheets"
            className="flex items-center gap-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30 transition-all active:scale-95"
            title="Google Sheets Live Sync for all factory modules"
          >
            <Cloud className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Sheets Sync</span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full bg-secondary hover:bg-muted px-2.5 py-1 text-[10px] font-extrabold text-foreground ring-1 ring-border transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
