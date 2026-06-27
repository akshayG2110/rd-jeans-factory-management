"use client"

import { apiFetch } from "@/lib/api"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  FileText, 
  Info,
  Calendar,
  Users,
  Wallet,
  HandCoins,
  Package,
  Scissors,
  Archive,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Handshake,
  Building2,
  BarChart3
} from "lucide-react"
import { getStoredData } from "@/lib/employee-store"

interface Props {
  params: Promise<{ category: string }>
}

export default function ReportDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { category } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [db, setDb] = useState<any>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      const data = await getStoredData()
      setDb(data)
    };
    loadData();
  }, [])

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const triggerExport = async (format: "Excel" | "PDF") => {
    setError(null)
    setLoading(true)
    setNotification(`Generating ${category} ${format} report...`)

    try {
      const formatLower = format.toLowerCase()
      const params = new URLSearchParams({
        report_type: category
      })
      
      const url = `${API_BASE}/reports/export/${formatLower}?${params.toString()}`
      const res = await apiFetch(url)

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No data available for this report.")
        }
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || errJson.message || "Failed to download.")
      }

      const blob = await res.blob()
      const contentDisposition = res.headers.get("Content-Disposition")
      let downloadFilename = `${category}_report.${format === "Excel" ? "xlsx" : "pdf"}`

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
      document.body.removeChild(a)
      window.URL.revokeObjectURL(fileUrl)

      setNotification(`Downloaded ${downloadFilename} successfully!`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Export failed.")
      setNotification(`Export failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
    setTimeout(() => setNotification(null), 4000)
  }

  if (!mounted || !db) {
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

  // Define dynamic content based on category parameter
  const renderReportContent = () => {
    switch (category) {
      case "employees": {
        const emps = db.employees || []
        const supervisorCount = emps.filter((e: any) => e.role === "Supervisor").length
        const stitchingCount = emps.filter((e: any) => e.role === "Stitching Worker").length
        const helperCount = emps.filter((e: any) => e.role === "Helper").length
        const otherCount = emps.length - supervisorCount - stitchingCount - helperCount

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Staff Strength</p>
                <p className="text-xl font-black text-foreground mt-0.5">{emps.length} Employees</p>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Stitching Department</p>
                <p className="text-xl font-black text-foreground mt-0.5">{stitchingCount} Workers</p>
              </div>
            </div>

            {/* List summary */}
            <div className="bg-card p-4 rounded-3xl ring-1 ring-border/60 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Staff Classification</h3>
              <div className="flex justify-between items-center text-xs border-b border-border/40 pb-2 text-muted-foreground font-semibold">
                <span>Supervisors</span>
                <span className="text-foreground font-bold">{supervisorCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-border/40 pb-2 text-muted-foreground font-semibold">
                <span>Stitching Handcrafts</span>
                <span className="text-foreground font-bold">{stitchingCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-border/40 pb-2 text-muted-foreground font-semibold">
                <span>Helpers & Logistics</span>
                <span className="text-foreground font-bold">{helperCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 text-muted-foreground font-semibold">
                <span>Administrative / Other Roles</span>
                <span className="text-foreground font-bold">{otherCount}</span>
              </div>
            </div>

            {/* Staff list */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Registered Workforce</h3>
              {emps.slice(0, 10).map((emp: any) => (
                <div key={emp.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground">₹{emp.salary.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Upad: ₹{emp.upad.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "salary": {
        const records = db.salaryRecords || []
        const totalWages = records.reduce((sum: number, r: any) => sum + r.salaryAmount, 0)
        const totalPaid = records.reduce((sum: number, r: any) => sum + r.paidAmount, 0)
        const totalPending = records.reduce((sum: number, r: any) => sum + r.remainingAmount, 0)

        return (
          <div className="flex flex-col gap-5">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3.5 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Wages Billed</p>
                <p className="text-sm font-black text-foreground mt-0.5">₹{totalWages.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3.5 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Wages Settled</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">₹{totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3.5 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Outstanding</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">₹{totalPending.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Recent Payout Records</h3>
              {records.slice(0, 10).map((r: any) => (
                <div key={r.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{r.employeeName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.month} {r.year} ({r.role})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">₹{r.paidAmount.toLocaleString("en-IN")}</p>
                    <p className={`text-[9px] font-bold mt-0.5 ${r.status === "Paid" ? "text-emerald-500" : "text-rose-500"}`}>
                      {r.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "upad": {
        const emps = db.employees || []
        const activeUpadEmps = emps.filter((e: any) => e.upad > 0)
        const totalOutstanding = activeUpadEmps.reduce((sum: number, e: any) => sum + e.upad, 0)
        const avgUpad = activeUpadEmps.length > 0 ? Math.round(totalOutstanding / activeUpadEmps.length) : 0

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Advance Owed</p>
                <p className="text-xl font-black text-foreground mt-0.5">₹{totalOutstanding.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Workers with Advance</p>
                <p className="text-xl font-black text-foreground mt-0.5">{activeUpadEmps.length} Employees</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Employee-Wise Upad Ledger</h3>
              {activeUpadEmps.map((emp: any) => (
                <div key={emp.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-rose-600">₹{emp.upad.toLocaleString("en-IN")}</p>
                    <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Opening Advance</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "seths": {
        const seths = db.seths || []
        
        return (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {seths.map((s: any) => (
                <div key={s.id} className="bg-card p-5 rounded-3xl ring-1 ring-border/60 shadow-sm flex flex-col gap-3 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                    <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">Client Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span>Received Fabric</span>
                      <p className="text-foreground font-bold mt-0.5">{s.totalFabric.toLocaleString("en-IN")} m</p>
                    </div>
                    <div>
                      <span>Total Rolls</span>
                      <p className="text-foreground font-bold mt-0.5">{s.totalRolls} units</p>
                    </div>
                    <div>
                      <span>Pieces Cut</span>
                      <p className="text-foreground font-bold mt-0.5">{s.totalCuttingPieces.toLocaleString("en-IN")} pcs</p>
                    </div>
                    <div>
                      <span>Cutting Lots</span>
                      <p className="text-foreground font-bold mt-0.5">{s.totalCuttingLots} lots</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "fabric": {
        const receives = db.fabricReceives || []
        const totalReceived = receives.reduce((sum: number, r: any) => sum + r.receivedQty, 0)
        const totalUsed = receives.reduce((sum: number, r: any) => sum + r.usedQty, 0)
        const totalBalance = receives.reduce((sum: number, r: any) => sum + r.remainingQty, 0)

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Meters Received</p>
                <p className="text-sm font-black text-foreground mt-0.5">{totalReceived.toLocaleString("en-IN")}m</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Meters Consumed</p>
                <p className="text-sm font-black text-indigo-600 mt-0.5">{totalUsed.toLocaleString("en-IN")}m</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Warehouse Stock</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">{totalBalance.toLocaleString("en-IN")}m</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Fabric Receive History</h3>
              {receives.map((r: any) => (
                <div key={r.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">Roll No: {r.rollNo} ({r.fabricType})</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Seth: {r.sethName} | Date: {r.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground">{r.receivedQty} Meters</p>
                    <span className="text-[9px] text-muted-foreground font-bold mt-0.5 block">Used: {r.usedQty}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "rolls": {
        const receives = db.fabricReceives || []
        const fullRolls = receives.filter((r: any) => r.status === "Active").length
        const partialRolls = receives.filter((r: any) => r.status === "Partially Used").length
        const completedRolls = receives.filter((r: any) => r.status === "Completed").length

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Full Rolls</p>
                <p className="text-sm font-black text-indigo-600 mt-0.5">{fullRolls} Rolls</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Partially Cut</p>
                <p className="text-sm font-black text-amber-600 mt-0.5">{partialRolls} Rolls</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Fully Consumed</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">{completedRolls} Rolls</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Roll Tracking List</h3>
              {receives.map((r: any) => (
                <div key={r.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">Roll No: {r.rollNo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Short: {r.shortNo} | {r.fabricType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground">Rem: {r.remainingQty}m</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold mt-1 ${
                      r.status === "Active" ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20" : 
                      r.status === "Partially Used" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20" : 
                      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "cutting": {
        const cuttings = db.cuttings || []
        const totalLots = cuttings.length
        const totalPieces = cuttings.reduce((sum: number, c: any) => sum + c.pieces, 0)
        const totalUsedMeters = cuttings.reduce((sum: number, c: any) => sum + c.meterUsed, 0)

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Lots</p>
                <p className="text-sm font-black text-foreground mt-0.5">{totalLots} Lots</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Pieces Cut</p>
                <p className="text-sm font-black text-red-600 mt-0.5">{totalPieces.toLocaleString("en-IN")} pcs</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Meters Consumed</p>
                <p className="text-sm font-black text-indigo-600 mt-0.5">{totalUsedMeters}m</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Lot Wise Production History</h3>
              {cuttings.map((c: any) => (
                <div key={c.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">Lot Number: #{c.lotNo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sizes: {c.size} | Average: {c.average}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600">{c.pieces} Pieces</p>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">Used: {c.meterUsed}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "income": {
        const incomes = db.incomes || []
        const totalIncVal = incomes.filter((i: any) => i.status === "Received").reduce((sum: number, i: any) => sum + i.amount, 0)
        const sethPayments = incomes.filter((i: any) => i.source === "Payment Received From Seth" && i.status === "Received").reduce((sum: number, i: any) => sum + i.amount, 0)
        const otherInc = incomes.filter((i: any) => i.source === "Other Income" && i.status === "Received").reduce((sum: number, i: any) => sum + i.amount, 0)

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Income</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">₹{totalIncVal.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Seth Payments</p>
                <p className="text-sm font-black text-foreground mt-0.5">₹{sethPayments.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Other Revenue</p>
                <p className="text-sm font-black text-foreground mt-0.5">₹{otherInc.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Ledger Income Receipts</h3>
              {incomes.map((inc: any) => (
                <div key={inc.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{inc.notes}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Source: {inc.source} | Ref: {inc.refNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">+₹{inc.amount.toLocaleString("en-IN")}</p>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">{inc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "expense": {
        const expenses = db.expenses || []
        const totalExpVal = expenses.filter((e: any) => e.status === "Paid").reduce((sum: number, e: any) => sum + e.amount, 0)
        
        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Expenses Disbursed</p>
              <p className="text-xl font-black text-rose-600 mt-0.5">₹{totalExpVal.toLocaleString("en-IN")}</p>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Operational Spendings</h3>
              {expenses.map((exp: any) => (
                <div key={exp.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{exp.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Category: {exp.category} | Method: {exp.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-rose-600">-₹{exp.amount.toLocaleString("en-IN")}</p>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">{exp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "cashbook": {
        const cashBook = db.cashBook || []
        const totalIn = cashBook.filter((tx: any) => tx.type === "Money In").reduce((sum: number, tx: any) => sum + tx.amount, 0)
        const totalOut = cashBook.filter((tx: any) => tx.type === "Money Out").reduce((sum: number, tx: any) => sum + tx.amount, 0)
        const netFlow = totalIn - totalOut

        return (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Inflow</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">+₹{totalIn.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Outflow</p>
                <p className="text-xs font-black text-rose-600 mt-0.5">-₹{totalOut.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card p-3 rounded-2xl ring-1 ring-border/60">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Net Ledger Flow</p>
                <p className={`text-xs font-black mt-0.5 ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {netFlow >= 0 ? "+" : ""}₹{netFlow.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Cash Flow Ledger logs</h3>
              {cashBook.map((tx: any) => (
                <div key={tx.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{tx.partyName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Category: {tx.category} | Ref: {tx.refNo}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === "Money In" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "Money In" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">{tx.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "partners": {
        const partners = db.partners || []
        const txs = db.partnerTransactions || []

        return (
          <div className="flex flex-col gap-5">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {partners.map((p: any) => (
                <div key={p.id} className="bg-card p-5 rounded-3xl ring-1 ring-border/60 shadow-sm flex flex-col gap-2.5 text-xs font-semibold">
                  <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-2">{p.name} Ledger</h3>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span>Capital Contributed</span>
                      <p className="text-foreground font-bold">₹{p.totalInvestment.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <span>Withdrawals</span>
                      <p className="text-foreground font-bold">₹{p.totalWithdrawal.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <span>Current Position</span>
                      <p className="text-emerald-600 font-black">₹{p.currentBalance.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground px-1">Partners Capital Transactions</h3>
              {txs.map((t: any) => (
                <div key={t.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="font-bold text-foreground">{t.partnerName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.type}: {t.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${(t.type || "").includes("Withdrawal") ? "text-rose-600" : "text-emerald-600"}`}>
                      {(t.type || "").includes("Withdrawal") ? "-" : "+"}₹{(t.amount || 0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[9px] text-muted-foreground mt-0.5 block">{t.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "factory-summary": {
        const emps = db.employees || []
        const rolls = db.fabricReceives || []
        const cuttings = db.cuttings || []
        const partnerLedger = db.partners || []

        const totalSalary = (db.salaryRecords || []).reduce((sum: number, r: any) => sum + r.salaryAmount, 0)
        const totalUpad = emps.reduce((sum: number, emp: any) => sum + emp.upad, 0)
        const totalFabricMeters = rolls.reduce((sum: number, r: any) => sum + r.receivedQty, 0)
        const totalCuttings = cuttings.reduce((sum: number, c: any) => sum + c.pieces, 0)
        const cashFlowIn = (db.cashBook || []).filter((tx: any) => tx.type === "Money In").reduce((sum: number, tx: any) => sum + tx.amount, 0)
        const cashFlowOut = (db.cashBook || []).filter((tx: any) => tx.type === "Money Out").reduce((sum: number, tx: any) => sum + tx.amount, 0)
        const netCashBalance = cashFlowIn - cashFlowOut
        const totalPartnerBalance = partnerLedger.reduce((sum: number, p: any) => sum + p.currentBalance, 0)

        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground px-1">ERP Dynamic System Status Sheet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-semibold">
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Total Registered Staff</span>
                <span className="text-foreground font-bold">{emps.length} Employees</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Cumulative Wages Billed</span>
                <span className="text-foreground font-bold">₹{totalSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Outstanding Staff Advances</span>
                <span className="text-foreground font-bold">₹{totalUpad.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Total Fabric Rolls Material</span>
                <span className="text-foreground font-bold">{totalFabricMeters.toLocaleString("en-IN")} Meters</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Total Cutting Lots Produced</span>
                <span className="text-foreground font-bold">{totalCuttings.toLocaleString("en-IN")} Pieces</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Current Net Cash Reserves</span>
                <span className="text-emerald-600 font-black">₹{netCashBalance.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Partners Investment Value</span>
                <span className="text-foreground font-bold">₹{totalPartnerBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )
      }

      default: {
        return <p className="text-xs text-muted-foreground text-center py-6">Invalid report selection.</p>
      }
    }
  }

  // Capitalize name
  const pageTitle = (category || "").replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">
        
        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/reports" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{pageTitle} Report</h1>
            <p className="text-xs text-muted-foreground">Factory analytics output sheet</p>
          </div>
        </header>

        {/* Banner notification */}
        {notification && (
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 p-4 text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <Info className="h-4.5 w-4.5" />
            <span>{notification}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 p-4 text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="h-4.5 w-4.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Panel */}
        <section className="flex gap-3 bg-secondary rounded-[24px] p-4 ring-1 ring-border/30">
          <button
            onClick={() => triggerExport("Excel")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-muted py-2.5 text-xs font-bold text-emerald-600 ring-1 ring-border/60 transition-all active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={() => triggerExport("PDF")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-muted py-2.5 text-xs font-bold text-red-500 ring-1 ring-border/60 transition-all active:scale-95 disabled:opacity-50"
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Export PDF</span>
          </button>
        </section>

        {/* Dynamically Loaded Report Data */}
        <section className="flex flex-col gap-4">
          {renderReportContent()}
        </section>

      </div>
    </main>
  )
}
