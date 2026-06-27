"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Wallet, 
  TrendingUp, 
  CheckCircle, 
  X, 
  Calendar, 
  Eye, 
  Edit, 
  Info, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Percent, 
  FileText,
  Layers
} from "lucide-react"
import { getStoredData, createIncome, updateIncome, getRecentMonthsOptions, type IncomeRecord, type IncomeHistoryLog } from "@/lib/employee-store"

const SOURCES = ["Payment Received From Seth", "Other Income"]

export default function IncomePage() {
  const [mounted, setMounted] = useState(false)
  const [incomes, setIncomes] = useState<IncomeRecord[]>([])
  const [incomeLogs, setIncomeLogs] = useState<IncomeHistoryLog[]>([])

  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const triggerNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentYearStr = String(currentDate.getFullYear())
  const currentMonthPrefix = `${currentYearStr}-${String(currentMonthNum).padStart(2, '0')}`

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSource, setSelectedSource] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState("All")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)

  // Form Fields
  const [formDate, setFormDate] = useState("")
  const [formSource, setFormSource] = useState<IncomeRecord["source"]>("Payment Received From Seth")
  const [formAmount, setFormAmount] = useState("")
  const [formRefNo, setFormRefNo] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formStatus, setFormStatus] = useState<IncomeRecord["status"]>("Received")
  const [formHandledBy, setFormHandledBy] = useState<string>("")
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Cash")
  const [formPartyName, setFormPartyName] = useState<string>("")

  const loadData = async () => {
    const data = await getStoredData()
    setIncomes(data.incomes || [])
    setIncomeLogs(data.incomeHistoryLogs || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    setFormDate(new Date().toISOString().split("T")[0])
    setFormRefNo(`REF-${Math.floor(100000 + Math.random() * 900000)}`)
  }, [])

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingIncomeId(null)
    setFormAmount("")
    setFormNotes("")
    setFormStatus("Received")
    setFormHandledBy("")
    setFormPaymentMethod("Cash")
    setFormPartyName("")
    setFormDate(new Date().toISOString().split("T")[0])
    setFormRefNo(`REF-${Math.floor(100000 + Math.random() * 900000)}`)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (inc: IncomeRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingIncomeId(inc.id)
    setFormSource(inc.source)
    setFormAmount(inc.amount.toString())
    setFormRefNo(inc.refNo)
    setFormNotes(inc.notes)
    setFormStatus(inc.status)
    setFormDate(inc.date)
    setFormHandledBy(inc.handledBy || "Rajubhai")
    setFormPaymentMethod(inc.paymentMethod || "Cash")
    setFormPartyName(inc.partyName || "")
    setIsDialogOpen(true)
  }

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const amtNum = parseFloat(formAmount)
    if (isNaN(amtNum) || amtNum <= 0) return

    setIsSaving(true)
    setError(null)
    try {
      if (dialogMode === "add") {
        const result = await createIncome({
          source: formSource,
          amount: amtNum,
          date: formDate,
          refNo: formRefNo,
          notes: formNotes.trim() || `${formSource} processed`,
          status: formStatus,
          handledBy: formHandledBy,
          paymentMethod: formPaymentMethod,
          partyName: formPartyName.trim()
        })
        if (result) {
          triggerNotification("Income entry added successfully!")
        } else {
          throw new Error("Failed to save income entry.")
        }
      } else if (dialogMode === "edit" && editingIncomeId) {
        const result = await updateIncome(editingIncomeId, {
          source: formSource,
          amount: amtNum,
          date: formDate,
          refNo: formRefNo,
          notes: formNotes.trim(),
          status: formStatus,
          handledBy: formHandledBy,
          paymentMethod: formPaymentMethod,
          partyName: formPartyName.trim()
        })
        if (result) {
          triggerNotification("Income entry updated successfully!")
        } else {
          throw new Error("Failed to update income entry.")
        }
      }
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred while saving.")
    } finally {
      setIsSaving(false)
      await loadData()
    }
  }

  // Summary Metrics calculations
  const todayDateStr = new Date().toISOString().split("T")[0]
  
  const todaysIncome = incomes
    .filter((inc) => inc.date === todayDateStr && (inc.status || "") === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  // June 2026 Monthly Income (Matches ₹9,20,000 from dashboard)
  const monthlyIncome = incomes
    .filter((inc) => (inc.date || "").includes(currentMonthPrefix) && (inc.status || "") === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  const yearlyIncome = incomes
    .filter((inc) => (inc.date || "").includes(currentYearStr) && (inc.status || "") === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  const totalIncome = incomes
    .filter((inc) => (inc.status || "") === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Filter list
  const filteredIncomes = incomes.filter((inc) => {
    const matchesSearch = (inc.notes || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || (inc.refNo || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    const matchesSource = selectedSource === "All" || inc.source === selectedSource
    
    let matchesMonth = true
    if (selectedMonth !== "All") {
      matchesMonth = (inc.date || "").includes(`-0${selectedMonth}`) || (inc.date || "").includes(`-${selectedMonth}`)
    }

    return matchesSearch && matchesSource && matchesMonth
  })

  // Source-wise totals
  const sethPaymentsTotal = incomes
    .filter((inc) => inc.source === "Payment Received From Seth" && inc.status === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  const otherIncomeTotal = incomes
    .filter((inc) => inc.source === "Other Income" && inc.status === "Received")
    .reduce((sum, inc) => sum + inc.amount, 0)

  const netIncome = sethPaymentsTotal + otherIncomeTotal

  // Recent 5 entries
  const recentEntries = incomes.slice(0, 5)

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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">
        
        {/* Page Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link 
              href="/" 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Income Management</h1>
              <p className="text-xs text-muted-foreground">Track Money Received</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Income</span>
          </button>
        </header>

        {/* Notifications */}
        {notification && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-200 flex items-center gap-2">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 p-4 text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <X className="h-4.5 w-4.5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Today's Income</p>
              <p className="text-lg font-bold text-foreground">₹{todaysIncome.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Monthly Income</p>
              <p className="text-lg font-bold text-foreground">₹{monthlyIncome.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Yearly Income</p>
              <p className="text-lg font-bold text-foreground">₹{yearlyIncome.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Wallet className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Income</p>
              <p className="text-lg font-bold text-foreground">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Income Sources cards */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1 font-bold">Income Sources</h2>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="flex items-center justify-between bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ArrowUpRight className="h-5.5 w-5.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Seth Payments</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Stitching & fabric arrivals</p>
                </div>
              </div>
              <p className="text-sm font-black text-emerald-600">₹{sethPaymentsTotal.toLocaleString("en-IN")}</p>
            </div>

            <div className="flex items-center justify-between bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ArrowUpRight className="h-5.5 w-5.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Other Income</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Scrap waste sales & misc</p>
                </div>
              </div>
              <p className="text-sm font-black text-emerald-600">₹{otherIncomeTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Income remarks or Ref No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-secondary py-3 pr-4 pl-10 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Sources</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s === "Payment Received From Seth" ? "Seth Payments" : "Other Income"}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Months</option>
                {getRecentMonthsOptions(6).map((opt) => (
                  <option key={opt.key} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Income List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Income ledger logs</h2>
          {filteredIncomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No income entries found matching criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredIncomes.map((inc) => (
                <div
                  key={inc.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">
                        {inc.source === "Payment Received From Seth" ? "Payment From Seth" : "Other Income"}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground font-semibold">{inc.notes}</p>
                    </div>

                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      inc.status === "Received" 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                        : inc.status === "Pending"
                        ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/50 pt-3 text-[10px] font-bold text-muted-foreground">
                    <div className="text-left">
                      <p className="uppercase text-[9px]">Date</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {new Date(inc.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="uppercase text-[9px] text-right">Amount</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">₹{inc.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                    <Link
                      href={`/income/${inc.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={(e) => handleOpenEditDialog(inc, e)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-card hover:bg-muted py-2.5 text-xs font-bold text-foreground ring-1 ring-border/60 transition-all active:scale-95"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Income Summary Section */}
        <section className="flex flex-col gap-3.5 rounded-[28px] bg-secondary p-6 ring-1 ring-border/30 font-semibold">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Income Summary</h3>
          </div>

          <div className="flex flex-col gap-3 bg-card rounded-2xl p-4 shadow-xs text-xs">
            <div className="flex justify-between items-center text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Total Seth Payments</span>
              <span className="text-foreground font-bold font-black">₹{sethPaymentsTotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Total Other Income</span>
              <span className="text-foreground font-bold font-black">₹{otherIncomeTotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-foreground font-black">Net Income</span>
              <span className="text-sm font-black text-emerald-600 font-extrabold">₹{netIncome.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        {/* Recent Income Activity */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Activity</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity logs.</p>
            ) : (
              recentEntries.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between pb-3 border-b border-border/40 last:border-b-0 last:pb-0 pt-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {log.source === "Payment Received From Seth" ? "Payment Received" : "Other Income"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {log.notes} (Ref: {log.refNo})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      +₹{log.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{log.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Add Income Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Add Income Entry" : "Edit Income Log"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Income Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s === "Payment Received From Seth" ? "Seth Payments" : "Other Income"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Name (Party)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahavir Seth"
                    value={formPartyName}
                    onChange={(e) => setFormPartyName(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Handled By *</label>
                  <select
                    required
                    value={formHandledBy}
                    onChange={(e) => setFormHandledBy(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    <option value="" disabled>Select Partner</option>
                    <option value="Rajubhai">Rajubhai</option>
                    <option value="Dhruveshbhai">Dhruveshbhai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Reference Number</label>
                  <input
                    type="text"
                    required
                    value={formRefNo}
                    onChange={(e) => setFormRefNo(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Payment Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Stitching Payment Mahavir Seth"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-2xl bg-[#16a34a] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>{isSaving ? "Saving..." : "Save Entry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
