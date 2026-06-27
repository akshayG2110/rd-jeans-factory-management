"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Calendar, 
  Info, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  CircleDot
} from "lucide-react"
import { getStoredData, type CashBookRecord } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function CashBookDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [tx, setTx] = useState<CashBookRecord | null>(null)

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    const record = (data.cashBook || []).find((c) => c.id === id)
    if (record) {
      setTx(record)
    }
  
    };
    loadData();
}, [id])

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-32 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!tx) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Transaction record not found</p>
          <Link href="/cashbook" className="text-sm font-bold text-primary hover:underline">
            Back to Cash Book
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/cashbook" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Transaction Details</h1>
            <p className="text-xs text-muted-foreground">Ledger specification & voucher verification sheet</p>
          </div>
        </header>

        {/* Details Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${
                tx.type === "Money In" 
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 animate-pulse" 
                  : "bg-rose-100 dark:bg-rose-950/40 text-rose-600 animate-pulse"
              }`}>
                {tx.type === "Money In" ? <ArrowUpRight className="h-5.5 w-5.5" /> : <ArrowDownLeft className="h-5.5 w-5.5" />}
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {tx.category}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Ref No: {tx.refNo}</p>
              </div>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              tx.type === "Money In" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
            }`}>
              {tx.type}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount Transacted</p>
            <p className={`text-3xl font-black mt-1 ${tx.type === "Money In" ? "text-emerald-600" : "text-rose-600"}`}>
              {tx.type === "Money In" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6 text-xs font-semibold text-muted-foreground">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold">Transaction Date</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold">Cash Direction</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{tx.type}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold">Category</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{tx.category}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold">Party Name / Source</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{tx.partyName}</p>
            </div>
          </div>

          {tx.remarks && (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-bold">Remarks / Purpose</p>
              <p className="text-xs font-semibold text-foreground mt-1 bg-secondary p-3 rounded-xl">
                {tx.remarks}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
