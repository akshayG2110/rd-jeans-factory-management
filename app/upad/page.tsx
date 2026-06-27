"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  HandCoins, 
  DollarSign, 
  Users, 
  Percent, 
  X, 
  Eye, 
  Calendar, 
  TrendingDown, 
  Calculator,
  CheckCircle
} from "lucide-react"
import { getStoredData, createUpad, getRecentMonthsOptions, type Employee, type Transaction } from "@/lib/employee-store"

export default function UpadPage() {
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

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

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("All")
  const [statusFilter, setStatusFilter] = useState<"All" | "Low" | "Medium" | "High">("All")

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formHandledBy, setFormHandledBy] = useState<string>("")
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Cash")

  const loadData = async () => {
    const data = await getStoredData()
    setEmployees(data.employees || [])
    setTransactions(data.transactions || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    // Set default date to today
    setFormDate(new Date().toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (employees.length > 0 && !formEmployeeId) {
      setFormEmployeeId(employees[0].id)
    }
  }, [employees])

  const handleOpenAddDialog = (empId?: string) => {
    if (empId) {
      setFormEmployeeId(empId)
    } else if (employees.length > 0) {
      setFormEmployeeId(employees[0].id)
    }
    setFormAmount("")
    setFormDate(new Date().toISOString().split("T")[0])
    setFormNotes("")
    setFormHandledBy("")
    setFormPaymentMethod("Cash")
    setIsDialogOpen(true)
  }

  const handleAddUpadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const amountNum = parseFloat(formAmount)
    if (isNaN(amountNum) || amountNum <= 0 || !formEmployeeId) return

    const selectedEmp = employees.find((emp) => emp.id === formEmployeeId)
    if (!selectedEmp) return

    setIsSaving(true)
    setError(null)
    try {
      const res = await createUpad({
        employeeId: formEmployeeId,
        amount: amountNum,
        date: formDate,
        description: formNotes || "Upad advance given",
        paymentMethod: formPaymentMethod,
        notes: formNotes,
        handledBy: formHandledBy
      })
      if (res) {
        triggerNotification(`Upad entry added successfully for ${selectedEmp.name}!`)
      } else {
        throw new Error("Failed to save Upad entry.")
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

  // Summary Metrics Calculations
  const totalUpadOutstanding = employees.reduce((sum, emp) => sum + (emp.upad || 0), 0)
  
  // Calculate advances given this month
  const thisMonthUpad = transactions
    .filter((tx) => tx.type === "upad" && (tx.date || "").startsWith(currentMonthPrefix))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0)

  const employeesWithUpad = employees.filter((emp) => (emp.upad || 0) > 0).length
  const averageUpad = employeesWithUpad > 0 ? Math.round(totalUpadOutstanding / employeesWithUpad) : 0

  // Helper to determine Upad level status badge
  const getUpadStatus = (amount: number): "Low" | "Medium" | "High" => {
    if (amount <= 2000) return "Low"
    if (amount <= 5000) return "Medium"
    return "High"
  }

  // Filter and process list
  const filteredEmployees = employees
    .filter((emp) => {
      if ((emp.upad || 0) <= 0) return false // Only display employees who have ever had or currently have upad
      
      const matchesSearch = (emp.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
      
      let matchesStatus = true
      if (statusFilter !== "All") {
        matchesStatus = getUpadStatus(emp.upad || 0) === statusFilter
      }

      let matchesMonth = true
      if (selectedMonth !== "All") {
        const empTxs = transactions.filter((t) => t.employeeId === emp.id && t.type === "upad")
        matchesMonth = empTxs.some((tx) => (tx.date || "").includes(`-0${selectedMonth}`) || (tx.date || "").includes(`-${selectedMonth}`))
      }

      return matchesSearch && matchesStatus && matchesMonth
    })
    .map((emp) => {
      // Find the last upad transaction details for this employee
      const empTxs = transactions.filter((t) => t.employeeId === emp.id && t.type === "upad")
      const lastTx = empTxs[0] // Since we prepend new transactions, the 0th is the latest
      
      return {
        ...emp,
        lastUpadAmount: lastTx ? lastTx.amount : 0,
        lastUpadDate: lastTx ? lastTx.date : "N/A"
      }
    })

  // Recent 5 Upad transactions
  const recentUpads = transactions
    .filter((tx) => tx.type === "upad")
    .slice(0, 5)

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Upad Management</h1>
              <p className="text-xs text-muted-foreground">Employee Advance Records</p>
            </div>
          </div>
          
          <button
            onClick={() => handleOpenAddDialog()}
            className="flex items-center gap-1.5 rounded-full bg-[#ea580c] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Upad</span>
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
              <HandCoins className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Outstanding</p>
              <p className="text-lg font-bold text-foreground">₹{totalUpadOutstanding.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">This Month Upad</p>
              <p className="text-lg font-bold text-foreground">₹{thisMonthUpad.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <Users className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Staff With Upad</p>
              <p className="text-lg font-bold text-foreground">{employeesWithUpad}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/10">
              <Percent className="h-4.5 w-4.5 text-[#16a34a]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Average Upad</p>
              <p className="text-lg font-bold text-foreground">₹{averageUpad.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-secondary py-3 pr-4 pl-10 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Levels</option>
                <option value="Low">Low Upad (≤ ₹2,000)</option>
                <option value="Medium">Medium Upad (₹2,000 - ₹5,000)</option>
                <option value="High">High Upad (&gt; ₹5,000)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Date Month</label>
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

        {/* Upad List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Advance Ledger List</h2>
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No records match your search query or criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEmployees.map((emp) => {
                const statusLvl = getUpadStatus(emp.upad)
                return (
                  <div
                    key={emp.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-base leading-tight">{emp.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground font-semibold">Role: {emp.role}</p>
                      </div>
                      
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        statusLvl === "Low" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                          : statusLvl === "Medium"
                          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400"
                          : "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400"
                      }`}>
                        {statusLvl} Upad
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Current Upad</p>
                        <p className="text-xs font-bold text-[#ea580c] mt-0.5">₹{(emp.upad || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Last Upad</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">₹{(emp.lastUpadAmount || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase text-right">Date</p>
                        <p className="text-[10px] font-bold text-foreground mt-0.5 text-right">{emp.lastUpadDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                      <Link
                        href={`/upad/${emp.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                      <button
                        onClick={() => handleOpenAddDialog(emp.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-card hover:bg-muted py-2.5 text-xs font-bold text-foreground ring-1 ring-border/60 transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4 text-[#ea580c]" />
                        <span>Add Upad</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Upad Activity */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Upad Activity</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentUpads.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent upads recorded.</p>
            ) : (
              recentUpads.map((tx, idx) => {
                const emp = employees.find((e) => e.id === tx.employeeId)
                return (
                  <div 
                    key={tx.id} 
                    className={`flex items-center justify-between pb-3 ${idx < recentUpads.length - 1 ? 'border-b border-border/50' : ''} pt-2.5`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
                        <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{emp ? emp.name : "Employee"}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{tx.date} — {tx.description}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      ₹{(tx.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>

      {/* Add Upad Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Add Employee Advance (Upad)</h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleAddUpadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Employee Selection</label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date Given</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
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
                  <label className="text-xs font-bold text-muted-foreground">Advance Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3000"
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase materials, festival advance"
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
                  className="flex-1 rounded-2xl bg-[#ea580c] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
