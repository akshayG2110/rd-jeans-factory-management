"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Wallet, 
  TrendingDown, 
  CheckCircle, 
  X, 
  Calendar, 
  Eye, 
  Edit, 
  Info, 
  ArrowDownRight, 
  Zap, 
  Home, 
  Truck, 
  Wrench, 
  HandCoins, 
  Layers, 
  Percent,
  HelpCircle
} from "lucide-react"
import { getStoredData, createExpense, updateExpense, getRecentMonthsOptions, type ExpenseRecord, type ExpenseHistoryLog } from "@/lib/employee-store"

const CATEGORIES = [
  "Salary",
  "Upad",
  "Transport",
  "Electricity",
  "Rent",
  "Maintenance",
  "Miscellaneous"
] as const

const PAYMENT_METHODS = ["Cash", "GPay", "Bank Transfer", "Cheque"] as const
const STATUSES = ["Paid", "Pending", "Cancelled"] as const

// Get Icon for Category
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

export default function ExpensePage() {
  const [mounted, setMounted] = useState(false)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [expenseLogs, setExpenseLogs] = useState<ExpenseHistoryLog[]>([])
  
  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentYearStr = String(currentDate.getFullYear())
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const currentMonthName = monthNames[currentMonthNum - 1]
  const currentMonthPrefix = `${currentYearStr}-${String(currentMonthNum).padStart(2, '0')}`

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState("All")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  // Form Fields
  const [formTitle, setFormTitle] = useState("")
  const [formCategory, setFormCategory] = useState<ExpenseRecord["category"]>("Miscellaneous")
  const [formDate, setFormDate] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpenseRecord["paymentMethod"]>("GPay")
  const [formRefNo, setFormRefNo] = useState("")
  const [formRemarks, setFormRemarks] = useState("")
  const [formStatus, setFormStatus] = useState<ExpenseRecord["status"]>("Paid")
  const [formHandledBy, setFormHandledBy] = useState<string>("")
  const [formPartyName, setFormPartyName] = useState<string>("")

  const loadData = async () => {
    const data = await getStoredData()
    setExpenses(data.expenses || [])
    setExpenseLogs(data.expenseHistoryLogs || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    setFormDate(new Date().toISOString().split("T")[0])
    setFormRefNo(`TXN-${Math.floor(100000 + Math.random() * 900000)}`)
  }, [])

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingExpenseId(null)
    setFormTitle("")
    setFormCategory("Miscellaneous")
    setFormAmount("")
    setFormPaymentMethod("GPay")
    setFormRemarks("")
    setFormStatus("Paid")
    setFormHandledBy("")
    setFormPartyName("")
    setFormDate(new Date().toISOString().split("T")[0])
    setFormRefNo(`TXN-${Math.floor(100000 + Math.random() * 900000)}`)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (exp: ExpenseRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingExpenseId(exp.id)
    setFormTitle(exp.title)
    setFormCategory(exp.category)
    setFormAmount(exp.amount.toString())
    setFormPaymentMethod(exp.paymentMethod)
    setFormRefNo(exp.refNo)
    setFormRemarks(exp.remarks)
    setFormStatus(exp.status)
    setFormDate(exp.date)
    setFormHandledBy(exp.handledBy || "Rajubhai")
    setFormPartyName(exp.partyName || "")
    setIsDialogOpen(true)
  }

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const amtNum = parseFloat(formAmount)
    if (isNaN(amtNum) || amtNum <= 0) return

    if (dialogMode === "add") {
      await createExpense({
        title: formTitle.trim() || `${formCategory} Bill`,
        category: formCategory,
        amount: amtNum,
        date: formDate,
        paymentMethod: formPaymentMethod,
        refNo: formRefNo,
        remarks: formRemarks.trim(),
        status: formStatus,
        handledBy: formHandledBy,
        partyName: formPartyName.trim()
      })
    } else if (dialogMode === "edit" && editingExpenseId) {
      await updateExpense(editingExpenseId, {
        title: formTitle.trim(),
        category: formCategory,
        amount: amtNum,
        date: formDate,
        paymentMethod: formPaymentMethod,
        refNo: formRefNo,
        remarks: formRemarks.trim(),
        status: formStatus,
        handledBy: formHandledBy,
        partyName: formPartyName.trim()
      })
    }

    await loadData()
    setIsDialogOpen(false)
  }

  // Summary Metrics calculations (Status === "Paid")
  const todayDateStr = new Date().toISOString().split("T")[0]
  
  const todaysExpense = expenses
    .filter((exp) => (exp.date || "") === todayDateStr && exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0)

  // June 2026 Monthly (Matches ₹6,15,000 from dashboard)
  const monthlyExpense = expenses
    .filter((exp) => (exp.date || "").includes(currentMonthPrefix) && exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0)

  const yearlyExpense = expenses
    .filter((exp) => (exp.date || "").includes(currentYearStr) && exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalExpense = expenses
    .filter((exp) => exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Filter list
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = (exp.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || 
                          (exp.refNo || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                          (exp.remarks || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    const matchesCategory = selectedCategory === "All" || exp.category === selectedCategory
    
    let matchesMonth = true
    if (selectedMonth !== "All") {
      matchesMonth = (exp.date || "").includes(`-0${selectedMonth}`) || (exp.date || "").includes(`-${selectedMonth}`)
    }

    return matchesSearch && matchesCategory && matchesMonth
  })

  // Category summary totals for TOP Categories (e.g. June 2026)
  const categorySummary = CATEGORIES.map((cat) => {
    const amount = expenses
      .filter((exp) => exp.category === cat && exp.status === "Paid" && (exp.date || "").includes(currentMonthPrefix))
      .reduce((sum, exp) => sum + exp.amount, 0)
    
    const percentage = monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0

    return {
      name: cat,
      amount,
      percentage
    }
  }).sort((a, b) => b.amount - a.amount)

  // Expense Summary Section:
  // - Salary Expense (Salary + Upad)
  // - Factory Expense (Electricity + Rent + Maintenance)
  // - Operational Expense (Transport + Miscellaneous)
  const salaryExpenseSum = expenses
    .filter((exp) => (exp.category === "Salary" || exp.category === "Upad") && exp.status === "Paid" && (exp.date || "").includes(currentMonthPrefix))
    .reduce((sum, exp) => sum + exp.amount, 0)

  const factoryExpenseSum = expenses
    .filter((exp) => (exp.category === "Electricity" || exp.category === "Rent" || exp.category === "Maintenance") && exp.status === "Paid" && (exp.date || "").includes(currentMonthPrefix))
    .reduce((sum, exp) => sum + exp.amount, 0)

  const operationalExpenseSum = expenses
    .filter((exp) => (exp.category === "Transport" || exp.category === "Miscellaneous") && exp.status === "Paid" && (exp.date || "").includes(currentMonthPrefix))
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Recent 5 entries
  const recentEntries = expenses.slice(0, 5)

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
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link 
              href="/" 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Expense Management</h1>
              <p className="text-xs text-muted-foreground">Track Money Spent</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Today's Expense</p>
              <p className="text-lg font-bold text-foreground">₹{todaysExpense.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dc2626]/10 text-[#dc2626]">
              <TrendingDown className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Monthly Expense</p>
              <p className="text-lg font-bold text-foreground">₹{monthlyExpense.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Yearly Expense</p>
              <p className="text-lg font-bold text-foreground">₹{yearlyExpense.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600">
              <Wallet className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Expense</p>
              <p className="text-lg font-bold text-foreground">₹{totalExpense.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Category Overview */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Category Overview</h2>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {categorySummary.filter(c => ["Salary", "Transport", "Electricity", "Rent"].includes(c.name)).map((cat) => {
              const Icon = getCategoryIcon(cat.name)
              const colors = getCategoryColor(cat.name)
              return (
                <div key={cat.name} className="flex flex-col justify-between bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-sm min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${colors.bg}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">{cat.percentage}%</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-muted-foreground truncate">{cat.name} Expense</p>
                    <p className="text-sm font-black text-foreground mt-0.5">₹{cat.amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Top Expense Categories */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Top Expense Categories</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {categorySummary.slice(0, 4).map((cat) => {
              const Icon = getCategoryIcon(cat.name)
              const colors = getCategoryColor(cat.name)
              return (
                <div key={cat.name} className="flex items-center justify-between bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Percentage Share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">₹{cat.amount.toLocaleString("en-IN")}</p>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground mt-0.5">
                      <Percent className="h-3 w-3 text-red-500" />
                      <span>{cat.percentage}%</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Expense title, remarks or Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-secondary py-3 pr-4 pl-10 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
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

        {/* Expense List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Expense Log Cards</h2>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No expenses found matching criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredExpenses.map((exp) => {
                const Icon = getCategoryIcon(exp.category)
                const colors = getCategoryColor(exp.category)
                return (
                  <div
                    key={exp.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-bold text-foreground text-sm leading-tight">
                            {exp.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground font-semibold">Category: {exp.category}</p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                        exp.status === "Paid" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                          : exp.status === "Pending"
                          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                      }`}>
                        {exp.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-border/50 pt-3 text-[10px] font-bold text-muted-foreground">
                      <div className="text-left">
                        <p className="uppercase text-[9px]">Date</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="uppercase text-[9px] text-right">Amount</p>
                        <p className="text-sm font-black text-red-600 mt-0.5">₹{exp.amount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                      <Link
                        href={`/expense/${exp.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                      <button
                        onClick={(e) => handleOpenEditDialog(exp, e)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-card hover:bg-muted py-2.5 text-xs font-bold text-foreground ring-1 ring-border/60 transition-all active:scale-95"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Expense Summary Section */}
        <section className="flex flex-col gap-3.5 rounded-[28px] bg-secondary p-6 ring-1 ring-border/30 font-semibold">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Expense Summary ({currentMonthName} {currentYearStr})</h3>
          </div>

          <div className="flex flex-col gap-3 bg-card rounded-2xl p-4 shadow-xs text-xs">
            <div className="flex justify-between items-center text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Salary Expense (Wage & Upad)</span>
              <span className="text-foreground font-bold font-black">₹{salaryExpenseSum.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Factory Expense (Rent, Power, Maint)</span>
              <span className="text-foreground font-bold font-black">₹{factoryExpenseSum.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Operational Expense (Transport, Misc)</span>
              <span className="text-foreground font-bold font-black">₹{operationalExpenseSum.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-foreground font-black">Total Expense</span>
              <span className="text-sm font-black text-red-600 font-extrabold">₹{monthlyExpense.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        {/* Recent Expense Activity Timeline */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Activity</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity logs.</p>
            ) : (
              recentEntries.map((log) => {
                const Icon = getCategoryIcon(log.category)
                const colors = getCategoryColor(log.category)
                return (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between pb-3 border-b border-border/40 last:border-b-0 last:pb-0 pt-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.bg}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {log.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          Category: {log.category} (Ref: {log.refNo})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        -₹{log.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{log.date}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>

      {/* Add Expense Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Add Expense Entry" : "Edit Expense Log"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. June Factory Power Bill"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Name (Party)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Material Vendor"
                    value={formPartyName}
                    onChange={(e) => setFormPartyName(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 8500"
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
                  <label className="text-xs font-bold text-muted-foreground">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. paid online to GEB vendor support"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#dc2626] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
