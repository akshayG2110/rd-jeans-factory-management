"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  Info, 
  TrendingUp, 
  FileText 
} from "lucide-react"
import { getStoredData, type IncomeRecord, type IncomeHistoryLog } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function IncomeDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [income, setIncome] = useState<IncomeRecord | null>(null)
  const [logs, setLogs] = useState<IncomeHistoryLog[]>([])

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setLogs(data.incomeHistoryLogs)

    const record = data.incomes.find((inc) => inc.id === id)
    if (record) {
      setIncome(record)
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

  if (!income) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Income record not found</p>
          <Link href="/income" className="text-sm font-bold text-primary hover:underline">
            Back to Income Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter logs for this income
  const incomeTimeline = logs.filter((log) => log.incomeId === id)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/income" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Income Details</h1>
            <p className="text-xs text-muted-foreground">Receipt specification & verification sheet</p>
          </div>
        </header>

        {/* Details Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 animate-pulse">
                <TrendingUp className="h-5.5 w-5.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {income.source === "Payment Received From Seth" ? "Seth Stitching Payment" : "Other Income"}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Ref No: {income.refNo}</p>
              </div>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              income.status === "Received" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                : income.status === "Pending"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
            }`}>
              {income.status}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount Received</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">₹{income.amount.toLocaleString("en-IN")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6 text-xs font-semibold text-muted-foreground">
            <div>
              <p className="text-[10px] uppercase tracking-wider">Transaction Date</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {new Date(income.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider">Source Category</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{income.source}</p>
            </div>
          </div>

          {income.notes && (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes / Purpose</p>
              <p className="text-xs font-semibold text-foreground mt-1 bg-secondary p-3 rounded-xl">
                {income.notes}
              </p>
            </div>
          )}
        </div>

        {/* Income History Timeline */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1 flex items-center justify-between">
            <span>Income History Timeline</span>
            <span className="text-[11px] font-medium text-muted-foreground">{incomeTimeline.length} events</span>
          </h3>

          {incomeTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No ledger events logged.</p>
            </div>
          ) : (
            <div className="relative border-l border-border/70 ml-4 pl-6 flex flex-col gap-5 py-2">
              {incomeTimeline.map((item) => (
                <div key={item.id} className="relative">
                  <span className={`absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-background bg-emerald-100 text-emerald-600`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  </span>
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.action}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{item.remarks}</p>
                      </div>
                      <p className="text-sm font-extrabold text-emerald-600 shrink-0">₹{item.amount.toLocaleString("en-IN")}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
