"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Wallet, 
  Printer, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Edit 
} from "lucide-react"
import { getStoredData, updateSalary, type SalaryRecord, type Employee, type Transaction } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
]

const YEARS = ["2025", "2026", "2027"]

export default function SalaryDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [record, setRecord] = useState<SalaryRecord | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])

  // Modal dialog states
  const [activeDialog, setActiveDialog] = useState<"pay" | "edit" | null>(null)

  // Form Fields for Pay
  const [payAmount, setPayAmount] = useState("")
  const [payNotes, setPayNotes] = useState("")

  // Form Fields for Edit
  const [editSalaryAmount, setEditSalaryAmount] = useState("")
  const [editPaidAmount, setEditPaidAmount] = useState("")
  const [editMonth, setEditMonth] = useState("May")
  const [editYear, setEditYear] = useState("2026")
  const [editNotes, setEditNotes] = useState("")
  const [settledUpads, setSettledUpads] = useState<any[]>([])

  const loadData = async () => {
    const data = await getStoredData()
    setEmployees(data.employees || [])
    setTransactions(data.transactions || [])
    setSalaryRecords(data.salaryRecords || [])

    let rec = (data.salaryRecords || []).find((r) => r.id === id)

    try {
      const res = await fetch(`/api/salary/${id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const apiRec = json.data
          setSettledUpads(apiRec.settled_upads || [])
          if (rec) {
            rec = {
              ...rec,
              salaryAmount: parseFloat(apiRec.salary_amount || rec.salaryAmount),
              totalUpadDeducted: parseFloat(apiRec.total_upad_deducted || '0'),
              netPayable: parseFloat(apiRec.net_payable ?? apiRec.salary_amount),
              paidAmount: parseFloat(apiRec.paid_amount || rec.paidAmount),
              remainingAmount: parseFloat(apiRec.remaining_amount || rec.remainingAmount),
              settledUpads: apiRec.settled_upads || []
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching salary details:", e)
    }

    if (rec) {
      setRecord(rec)
      setPayAmount(rec.remainingAmount.toString())
      setEditSalaryAmount(rec.salaryAmount.toString())
      setEditPaidAmount(rec.paidAmount.toString())
      setEditMonth(rec.month)
      setEditYear(rec.year)
      setEditNotes(rec.notes)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
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

  if (!record) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Salary record not found</p>
          <Link href="/salary" className="text-sm font-bold text-[#16a34a] hover:underline">
            Back to Salary Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter salary history for this employee (excluding current record to prevent duplicating)
  const employeeHistory = salaryRecords.filter(
    (r) => r.employeeId === record.employeeId && r.id !== record.id
  )

  const handlePayBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) return

    const newPaidAmount = record.paidAmount + amt

    await updateSalary(record.id, {
      paidAmount: newPaidAmount,
      notes: payNotes || `Balance payment of ₹${amt} processed`,
      date: new Date().toISOString().split("T")[0]
    })

    await loadData()
    setActiveDialog(null)
    setPayNotes("")
  }

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const sal = parseFloat(editSalaryAmount)
    const paid = parseFloat(editPaidAmount)

    if (isNaN(sal) || isNaN(paid) || sal < 0 || paid < 0) return

    await updateSalary(record.id, {
      month: editMonth,
      year: editYear,
      salaryAmount: sal,
      paidAmount: paid,
      notes: editNotes,
      date: new Date().toISOString().split("T")[0]
    })

    await loadData()
    setActiveDialog(null)
  }

  const handlePrintSlip = () => {
    alert(`Generating salary slip for ${record.employeeName} (${record.month} ${record.year}). Sending to printer...`)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">
        
        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/salary" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Salary Details</h1>
            <p className="text-xs text-muted-foreground">Detailed monthly salary worksheet</p>
          </div>
        </header>

        {/* Profile Details Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{record.employeeName}</h2>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{record.role}</p>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              record.status === "Paid" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                : record.status === "Partially Paid"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400"
                : "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400"
            }`}>
              {record.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gross Salary</p>
              <p className="text-sm font-bold text-foreground mt-0.5">₹{record.salaryAmount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Upad Advance Deducted</p>
              <p className="text-sm font-bold text-[#ea580c] mt-0.5">
                {record.totalUpadDeducted && record.totalUpadDeducted > 0
                  ? `-₹${record.totalUpadDeducted.toLocaleString("en-IN")}`
                  : "₹0 (No Advance)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-5 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Net Payable</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ₹{(record.netPayable ?? record.salaryAmount).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid Amount</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{record.paidAmount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining</p>
              <p className="text-sm font-bold text-red-600 mt-0.5">₹{record.remainingAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {record.notes && (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="text-xs font-semibold text-foreground mt-1 bg-secondary p-3 rounded-xl">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Settled Advances Section (Upad Deduction Audit) */}
        {settledUpads.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-foreground px-1 flex items-center justify-between">
              <span>Settled Advances (Upad Deduction Audit)</span>
              <span className="text-[11px] font-bold text-[#ea580c]">{settledUpads.length} advance(s) deducted</span>
            </h3>
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-xs">
              {settledUpads.map((upad) => (
                <div key={upad.id} className="flex items-center justify-between border-b border-border/40 pb-2.5 pt-1 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Advance #{upad.id} — {upad.date ? upad.date.split("T")[0] : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {upad.payment_method} • Handled by {upad.handled_by} {upad.notes ? `• ${upad.notes}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#ea580c]">
                    -₹{parseFloat(upad.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons Section */}
        <section className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setActiveDialog("pay")}
            disabled={record.remainingAmount <= 0}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Wallet className="h-5 w-5 text-[#16a34a]" />
            <span className="text-[11px] font-bold text-foreground">Pay Salary</span>
          </button>

          <button
            onClick={() => setActiveDialog("edit")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95"
          >
            <Edit className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-bold text-foreground">Edit Salary</span>
          </button>

          <button
            onClick={handlePrintSlip}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95"
          >
            <Printer className="h-5 w-5 text-[#ea580c]" />
            <span className="text-[11px] font-bold text-foreground">Print Slip</span>
          </button>
        </section>

        {/* Timeline Salary History Section */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1 flex items-center justify-between">
            <span>Previous Salary Records</span>
            <span className="text-[11px] font-medium text-muted-foreground">{employeeHistory.length} records</span>
          </h3>

          {employeeHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No historical records for this worker.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {employeeHistory.map((hist) => (
                <div
                  key={hist.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{hist.month} {hist.year}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Issued on {hist.date}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">₹{hist.paidAmount.toLocaleString("en-IN")}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      hist.status === "Paid" ? "text-emerald-600" : hist.status === "Partially Paid" ? "text-orange-600" : "text-red-600"
                    }`}>
                      {hist.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Pay Remaining Balance Dialog */}
      {activeDialog === "pay" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Settle Outstanding Balance</h3>
              <button 
                onClick={() => setActiveDialog(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handlePayBalance} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Amount to Pay (₹)</label>
                <input
                  type="number"
                  required
                  max={record.remainingAmount}
                  placeholder={`Max ₹${record.remainingAmount}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Settle balance via Cash Book"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveDialog(null)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Salary Details Dialog */}
      {activeDialog === "edit" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Edit Salary Record</h3>
              <button 
                onClick={() => setActiveDialog(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleEditRecord} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Month</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Year</label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Salary Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={editSalaryAmount}
                  onChange={(e) => setEditSalaryAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Paid Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveDialog(null)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#16a34a] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
