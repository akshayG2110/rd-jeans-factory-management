"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Eye } from "lucide-react"
import { getStoredData } from "@/lib/employee-store"

export function CashBalanceCard() {
  const [mounted, setMounted] = useState(false)
  const [balance, setBalance] = useState(125000)

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    // Calculate cash balance dynamically
    const totalIn = (data.cashBook || []).filter(tx => tx.type === "Money In").reduce((sum, tx) => sum + tx.amount, 0)
    const totalOut = (data.cashBook || []).filter(tx => tx.type === "Money Out").reduce((sum, tx) => sum + tx.amount, 0)
    const currentBalance = totalIn - totalOut
    setBalance(currentBalance)
  
    };
    loadData();
}, [])

  if (!mounted) {
    return (
      <div className="h-32 w-full animate-pulse rounded-[24px] bg-muted"></div>
    )
  }

  return (
    <Link 
      href="/cashbook" 
      className="block overflow-hidden rounded-[24px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary-foreground/70">Cash Balance</p>
        <Eye className="h-5 w-5 text-primary-foreground/60" aria-hidden="true" />
      </div>
      <p className="mt-3 text-4xl font-bold tracking-tight">₹ {balance.toLocaleString("en-IN")}</p>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Updated today</span>
        </div>
        <span className="text-xs font-medium text-primary-foreground/70">Main Account Ledger</span>
      </div>
    </Link>
  )
}
