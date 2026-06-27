"use client"

import { apiFetch } from "@/lib/api"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Users, 
  Wallet, 
  HandCoins, 
  Package, 
  Scissors, 
  Building2, 
  Archive,
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Handshake, 
  BarChart3, 
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
  Info,
  Loader2,
  AlertTriangle
} from "lucide-react"

const REPORT_CATEGORIES = [
  { id: "employees", name: "Employee Reports", desc: "Staff registry, roles distribution & history log", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "salary", name: "Salary Reports", desc: "Monthly wage bills, outstanding salaries & cash payouts", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "upad", name: "Upad Reports", desc: "Employee advance summaries & outstanding advances", icon: HandCoins, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { id: "seths", name: "Seth Reports", desc: "Client profiles, status registry and supply sheets", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { id: "fabric", name: "Fabric Stock Reports", desc: "Denim meters stock registry & warehouse holdings", icon: Package, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
  { id: "rolls", name: "Roll Reports", desc: "Inventory of active rolls, complete usage sheets & tracking", icon: Archive, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "cutting", name: "Cutting Reports", desc: "Lot-wise piece counts, averages, and wastage analytics", icon: Scissors, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { id: "income", name: "Income Reports", desc: "Daily receipts breakdown, seth stitching pay & sales", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100/40 dark:bg-emerald-950/20" },
  { id: "expense", name: "Expense Reports", desc: "Operational spending breakdown & category metrics", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { id: "cashbook", name: "Cash Book Reports", desc: "Dynamic cash flow reconciliation & cash ledger statements", icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  { id: "partners", name: "Partner Reports", desc: "Investment ledgers, contributions & withdrawal records", icon: Handshake, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "factory-summary", name: "Factory Summary Report", desc: "Complete ERP operations summary & financial status sheet", icon: BarChart3, color: "text-fuchsia-500", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30" }
]

interface EmployeeOption {
  id: number
  employee_name: string
  role: string
}

interface SethOption {
  id: number
  seth_name: string
}

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  
  // Date Init helpers
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonthNum = currentDate.getMonth() + 1
  const firstDayOfMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-01`
  const todayStr = currentDate.toISOString().split("T")[0]

  // Filter States
  const [selectedReport, setSelectedReport] = useState("cashbook")
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  
  // Optional dynamic filters
  const [employeeId, setEmployeeId] = useState("")
  const [sethId, setSethId] = useState("")
  const [handledBy, setHandledBy] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("")
  const [incomeSource, setIncomeSource] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [lotNumber, setLotNumber] = useState("")

  // Live options fetched from backend database
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [seths, setSeths] = useState<SethOption[]>([])

  // UI Flow states
  const [loading, setLoading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"excel" | "pdf" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Aggregate stats display
  const [stats, setStats] = useState({
    employeesCount: 0,
    monthlySalaryTotal: 0,
    outstandingUpad: 0,
    fabricReceived: 0,
    piecesProduced: 0,
    cashBalance: 0
  })

  // Fetch filter options and aggregated summary stats on mount
  useEffect(() => {
    setMounted(true)
    const loadReportOptionsAndStats = async () => {
      try {
        // Fetch Employees
        const empRes = await apiFetch(`${API_BASE}/employees`)
        if (empRes.ok) {
          const empData = await empRes.json()
          if (empData.success && Array.isArray(empData.data)) {
            setEmployees(empData.data)
          }
        }

        // Fetch Seth clients
        const sethRes = await apiFetch(`${API_BASE}/seths`)
        if (sethRes.ok) {
          const sethData = await sethRes.json()
          if (sethData.success && Array.isArray(sethData.data)) {
            setSeths(sethData.data)
          }
        }

        // Fetch dashboard statistics for reporting summary
        const dashRes = await apiFetch(`${API_BASE}/dashboard`)
        if (dashRes.ok) {
          const dashData = await dashRes.json()
          if (dashData.success && dashData.data) {
            const d = dashData.data
            setStats({
              employeesCount: d.totalEmployees || 0,
              monthlySalaryTotal: d.monthlySalary || 0,
              outstandingUpad: d.totalUpad || 0,
              fabricReceived: d.fabricReceived || 0,
              piecesProduced: d.cuttingPieces || 0,
              cashBalance: d.income - d.expense
            })
          }
        }
      } catch (err) {
        console.error("Failed to load reporting options or stats:", err)
      }
    }
    loadReportOptionsAndStats()
  }, [])

  const triggerNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Action: Reset filter variables
  const handleResetFilters = () => {
    setFromDate(firstDayOfMonth)
    setToDate(todayStr)
    setEmployeeId("")
    setSethId("")
    setHandledBy("")
    setExpenseCategory("")
    setIncomeSource("")
    setStatusFilter("")
    setRollNumber("")
    setLotNumber("")
    setError(null)
    triggerNotification("Reset report parameter configurations.")
  }

  // Action: Dynamic fetch-based secure file download
  const handleDownload = async (format: "excel" | "pdf") => {
    setError(null)
    
    // Client-side date validation
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError("Start Date cannot be after End Date.")
      return
    }

    setLoading(true)
    setDownloadFormat(format)
    triggerNotification(`Generating and compiling ${selectedReport} ${format.toUpperCase()} report...`)

    try {
      // Build query string params
      const params = new URLSearchParams({
        report_type: selectedReport
      })

      if (fromDate) params.append("date_from", fromDate)
      if (toDate) params.append("date_to", toDate)
      if (employeeId) params.append("employee_id", employeeId)
      if (sethId) params.append("seth_id", sethId)
      if (handledBy) params.append("handled_by", handledBy)
      if (expenseCategory) params.append("expense_category", expenseCategory)
      if (incomeSource) params.append("income_source", incomeSource)
      if (statusFilter) params.append("status", statusFilter)
      if (rollNumber) params.append("roll_number", rollNumber)
      if (lotNumber) params.append("lot_number", lotNumber)

      const url = `${API_BASE}/reports/export/${format}?${params.toString()}`
      const res = await apiFetch(url)

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No data available for the selected filters.")
        }
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || errJson.message || "Failed to generate file payload from server.")
      }

      // Process download binary stream
      const blob = await res.blob()
      const contentDisposition = res.headers.get("Content-Disposition")
      let downloadFilename = `${selectedReport}_report.${format === "excel" ? "xlsx" : "pdf"}`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          downloadFilename = match[1]
        }
      }

      const fileUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = fileUrl
      a.download = downloadFilename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup DOM
      document.body.removeChild(a)
      window.URL.revokeObjectURL(fileUrl)

      triggerNotification(`Downloaded: ${downloadFilename}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Network request failed. Please check connection.")
    } finally {
      setLoading(false)
      setDownloadFormat(null)
    }
  }

  // Pre-select category & scroll into view helper
  const handleCardClick = (catId: string) => {
    setSelectedReport(catId)
    const element = document.getElementById("generator-panel")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    triggerNotification(`Selected ${catId.replace("-", " ")} category. Configure filters below.`)
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">
        
        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">ERP Reports Center</h1>
            <p className="text-xs text-muted-foreground">Dynamic Business Ledgers & Exports</p>
          </div>
        </header>

        {/* Banner notification */}
        {notification && (
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/30 p-4 text-xs font-bold text-indigo-700 dark:text-indigo-400 animate-in fade-in duration-200 flex items-center gap-2">
            <Info className="h-4.5 w-4.5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</p>
            <p className="text-base font-black text-foreground">{stats.employeesCount} staff</p>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Salary Bill</p>
            <p className="text-base font-black text-foreground">₹{stats.monthlySalaryTotal.toLocaleString("en-IN")}</p>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Outstanding Upad</p>
            <p className="text-base font-black text-foreground">₹{stats.outstandingUpad.toLocaleString("en-IN")}</p>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Fabric Recv</p>
            <p className="text-base font-black text-foreground">{stats.fabricReceived.toLocaleString("en-IN")} m</p>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Cuttings</p>
            <p className="text-base font-black text-foreground">{stats.piecesProduced.toLocaleString("en-IN")} pcs</p>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Cash Reserves</p>
            <p className={`text-base font-black ${stats.cashBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{stats.cashBalance.toLocaleString("en-IN")}
            </p>
          </div>
        </section>

        {/* Interactive Report Generator Form */}
        <section 
          id="generator-panel" 
          className="flex flex-col gap-5 rounded-3xl bg-card p-5 shadow-md ring-1 ring-border/60 relative overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 animate-in fade-in duration-200">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-bold text-foreground mt-2.5">
                Compiling and printing {downloadFormat?.toUpperCase()}...
              </p>
            </div>
          )}

          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-3">
            <Calendar className="h-4.5 w-4.5 text-primary" />
            <span>Dynamic Ledger & Report Generator</span>
          </h2>

          {/* Form Error Banner */}
          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 p-4 text-xs font-bold text-rose-700 dark:text-rose-400 flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Generation Failed</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400/80">{error}</span>
              </div>
            </div>
          )}

          {/* Select Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Report Category</label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value)
                setError(null)
              }}
              className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Date Parameters */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Dynamic Category Specific Filters */}
          <div className="flex flex-col gap-4 border-t border-border/40 pt-4">
            
            {/* Filter: Employee (For Salary/Upad) */}
            {(selectedReport === "salary" || selectedReport === "upad") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.employee_name} ({emp.role})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter: Seth Client (For Seths/Rolls/Fabric) */}
            {(selectedReport === "seths" || selectedReport === "rolls" || selectedReport === "fabric") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter Seth Client</label>
                <select
                  value={sethId}
                  onChange={(e) => setSethId(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Seth Suppliers</option>
                  {seths.map((s) => (
                    <option key={s.id} value={s.id}>{s.seth_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter: Partner (For Cashbook / Partner Ledger) */}
            {(selectedReport === "cashbook" || selectedReport === "partners") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter Handled By Partner</label>
                <select
                  value={handledBy}
                  onChange={(e) => setHandledBy(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Transactions</option>
                  <option value="Rajubhai">Rajubhai</option>
                  <option value="Dhruveshbhai">Dhruveshbhai</option>
                </select>
              </div>
            )}

            {/* Filter: Expense Category */}
            {selectedReport === "expense" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Expense Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Expenses</option>
                  <option value="Salary">Salary Payouts</option>
                  <option value="Upad">Upad Disbursements</option>
                  <option value="Rent">Factory Rent</option>
                  <option value="Electric Bill">Electric Bill</option>
                  <option value="Repair & Maintenance">Repair & Maintenance</option>
                  <option value="Tea & Water">Tea & Water</option>
                  <option value="Office Stationery">Office Stationery</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
            )}

            {/* Filter: Income Source */}
            {selectedReport === "income" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Income Source Category</label>
                <select
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Revenue</option>
                  <option value="Seth Payment">Seth Payment Receipts</option>
                  <option value="Other Income">Other Revenue Inflows</option>
                </select>
              </div>
            )}

            {/* Filter: General Status (For Employees, Seths, Rolls, Fabric) */}
            {["employees", "seths", "rolls", "fabric"].includes(selectedReport) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  {selectedReport === "employees" || selectedReport === "seths" ? (
                    <>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </>
                  ) : (
                    <>
                      <option value="Active">Active / Unused</option>
                      <option value="Partially Used">Partially Consumed</option>
                      <option value="Completed">Completed / Fully Used</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Filter: Roll/Lot text filters (For cutting or rolls) */}
            {selectedReport === "cutting" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Lot Number</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. R-01"
                    className="w-full rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                  />
                </div>
              </div>
            )}
            
            {/* Filter: Roll Number for Rolls Report */}
            {selectedReport === "rolls" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. R-01"
                  className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary font-bold focus:outline-none"
                />
              </div>
            )}

          </div>

          {/* Export Action Buttons */}
          <div className="flex gap-3 border-t border-border/40 pt-4">
            <button
              onClick={() => handleDownload("excel")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 p-4 text-emerald-700 dark:text-emerald-400 font-bold text-xs ring-1 ring-emerald-600/20 transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100/60 p-4 text-red-700 dark:text-red-400 font-bold text-xs ring-1 ring-red-600/20 transition-all active:scale-95"
            >
              <FileText className="h-5 w-5 text-red-600" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold px-1 mt-1">
            <span>* Parameters are applied live to backend SQL queries</span>
            <button 
              onClick={handleResetFilters} 
              className="text-primary hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* Interactive Report Sheets Categories Selector */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Configure Report Parameters</h2>
          <div className="flex flex-col gap-3.5">
            {REPORT_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedReport === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCardClick(cat.id)}
                  className={`flex items-center justify-between p-5 rounded-3xl ring-1 shadow-sm transition-all text-left ${
                    isSelected 
                      ? "bg-secondary ring-primary shadow-md translate-x-1" 
                      : "bg-card ring-border/60 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start gap-4 pr-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${cat.bg} ${cat.color}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm leading-tight">{cat.name}</h3>
                        {isSelected && (
                          <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-md font-bold uppercase">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-normal font-semibold">{cat.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 shrink-0 transition-transform ${isSelected ? "text-primary rotate-90" : "text-muted-foreground"}`} />
                </button>
              )
            })}
          </div>
        </section>

      </div>
    </main>
  )
}
