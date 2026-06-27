"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  Info, 
  TrendingDown, 
  CheckCircle,
  HelpCircle,
  Zap,
  Home,
  Truck,
  Wrench,
  HandCoins
} from "lucide-react"
import { getStoredData, type ExpenseRecord, type ExpenseHistoryLog } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Salary": return Wallet
    case "Upad": return HandCoins
    case "Transport": return Truck
    case "Electricity": return Zap
    case "Rent": return Home
    case "Maintenance": return Wrench
    default: return HelpCircle
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Salary": return { bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" }
    case "Upad": return { bg: "bg-orange-100 dark:bg-orange-950/40 text-orange-600" }
    case "Transport": return { bg: "bg-blue-100 dark:bg-blue-950/40 text-blue-600" }
    case "Electricity": return { bg: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600" }
    case "Rent": return { bg: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600" }
    case "Maintenance": return { bg: "bg-red-100 dark:bg-red-950/40 text-red-600" }
    default: return { bg: "bg-purple-100 dark:bg-purple-950/40 text-purple-600" }
  }
}

export default function ExpenseDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [expense, setExpense] = useState<ExpenseRecord | null>(null)
  const [logs, setLogs] = useState<ExpenseHistoryLog[]>([])

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setLogs(data.expenseHistoryLogs || [])

    const record = (data.expenses || []).find((exp) => exp.id === id)
    if (record) {
      setExpense(record)
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

  if (!expense) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Expense record not found</p>
          <Link href="/expense" className="text-sm font-bold text-primary hover:underline">
            Back to Expense Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter logs for this expense
  const timelineLogs = logs.filter((log) => log.expenseId === id)
  const CategoryIcon = getCategoryIcon(expense.category)
  const colors = getCategoryColor(expense.category)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/expense" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-bold">Expense Details</h1>
            <p className="text-xs text-muted-foreground">Receipt specification & voucher verification sheet</p>
          </div>
        </header>

        {/* Details Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}>
                <CategoryIcon className="h-5.5 w-5.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {expense.title}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Ref No: {expense.refNo}</p>
              </div>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              expense.status === "Paid" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                : expense.status === "Pending"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
            }`}>
              {expense.status}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount Spent</p>
            <p className="text-3xl font-black text-red-600 mt-1">₹{expense.amount.toLocaleString("en-IN")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6 text-xs font-semibold text-muted-foreground">
            <div>
              <p className="text-[10px] uppercase tracking-wider">Transaction Date</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {new Date(expense.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider">Category</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{expense.category}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider">Payment Method</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{expense.paymentMethod}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider">Reference Code</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{expense.refNo}</p>
            </div>
          </div>

          {expense.remarks && (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remarks / Purpose</p>
              <p className="text-xs font-semibold text-foreground mt-1 bg-secondary p-3 rounded-xl">
                {expense.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Expense History Timeline */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1 flex items-center justify-between">
            <span>Expense History Timeline</span>
            <span className="text-[11px] font-medium text-muted-foreground">{timelineLogs.length} events</span>
          </h3>

          {timelineLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No timeline events logged.</p>
            </div>
          ) : (
            <div className="relative border-l border-border/70 ml-4 pl-6 flex flex-col gap-5 py-2">
              {timelineLogs.map((item) => (
                <div key={item.id} className="relative">
                  <span className="absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-background bg-red-100 dark:bg-red-950/40 text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                  </span>
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">Status Action: {item.action}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{item.remarks}</p>
                      </div>
                      <p className="text-sm font-extrabold text-red-600 shrink-0">₹{item.amount.toLocaleString("en-IN")}</p>
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
