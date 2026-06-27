"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Wallet, 
  HandCoins, 
  Calendar, 
  CheckCircle2, 
  PlusCircle, 
  Edit3, 
  X, 
  Info,
  Clock
} from "lucide-react"
import { 
  getStoredData, 
  updateEmployee,
  createUpad,
  createSalary,
  MONTH_REV,
  getRecentMonthsOptions,
  type Employee, 
  type SalaryRecord, 
  type CashBookRecord,
  type Transaction 
} from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

const ROLE_OPTIONS: Employee["role"][] = [
  "Stitching Worker",
  "Cutting Worker",
  "Helper",
  "Indoor Staff",
  "Outdoor Staff",
  "Supervisor",
]

export default function EmployeeDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  
  // Data lists
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cashBook, setCashBook] = useState<CashBookRecord[]>([])

  // Modal Dialog States
  const [activeDialog, setActiveDialog] = useState<"paySalary" | "addUpad" | "editEmployee" | null>(null)

  // Edit Employee Form
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<Employee["role"]>("Stitching Worker")
  const [editStatus, setEditStatus] = useState<Employee["status"]>("active")

  // Add Upad Form
  const [inputUpadAmount, setInputUpadAmount] = useState("")
  const [inputUpadMethod, setInputUpadMethod] = useState("Cash")
  const [inputUpadDate, setInputUpadDate] = useState("")
  const [inputUpadRemarks, setInputUpadRemarks] = useState("")
  const [inputUpadHandledBy, setInputUpadHandledBy] = useState("")

  // Pay Salary Form
  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const currentMonthName = MONTH_REV[currentMonthNum] || "June"

  const [inputSalaryAmount, setInputSalaryAmount] = useState("")
  const [inputSalaryPaid, setInputSalaryPaid] = useState("")
  const [inputSalaryMonth, setInputSalaryMonth] = useState(currentMonthName)
  const [inputSalaryYear, setInputSalaryYear] = useState(String(currentYear))
  const [inputSalaryDate, setInputSalaryDate] = useState("")
  const [inputSalaryRemarks, setInputSalaryRemarks] = useState("")
  const [inputSalaryMethod, setInputSalaryMethod] = useState("Cash")
  const [inputSalaryHandledBy, setInputSalaryHandledBy] = useState("")

  // Filter States
  const [inputDateFrom, setInputDateFrom] = useState("")
  const [inputDateTo, setInputDateTo] = useState("")
  const [inputType, setInputType] = useState("All")

  const [activeDateFrom, setActiveDateFrom] = useState("")
  const [activeDateTo, setActiveDateTo] = useState("")
  const [activeType, setActiveType] = useState("All")

  const handleApplyFilters = () => {
    setActiveDateFrom(inputDateFrom)
    setActiveDateTo(inputDateTo)
    setActiveType(inputType)
  }

  const handleResetFilters = () => {
    setInputDateFrom("")
    setInputDateTo("")
    setInputType("All")
    setActiveDateFrom("")
    setActiveDateTo("")
    setActiveType("All")
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [id])

  const loadData = async () => {
    const data = await getStoredData()
    setEmployees(data.employees || [])
    setSalaryRecords(data.salaryRecords || [])
    setTransactions(data.transactions || [])
    setCashBook(data.cashBook || [])
    
    const emp = (data.employees || []).find((e) => e.id === id)
    if (emp) {
      setEmployee(emp)
      setEditName(emp.name)
      setEditRole(emp.role)
      setEditStatus(emp.status)
    }

    const today = new Date().toISOString().split("T")[0]
    setInputUpadDate(today)
    setInputSalaryDate(today)
  }

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

  if (!employee) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Employee not found</p>
          <Link href="/employees" className="text-sm font-bold text-primary hover:underline">
            Back to Employee List
          </Link>
        </div>
      </main>
    )
  }

  const currentDateObj = new Date()
  const yyyy = currentDateObj.getFullYear()
  const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0')
  const currentMonthPrefix = `${yyyy}-${mm}`

  // Filter Salary History
  const empSalaries = salaryRecords.filter((s) => s.employeeId === id)
  
  // Filter Upad Transactions
  const empUpadTxs = transactions.filter((t) => t.employeeId === id && t.type === "upad")

  // 1. Employee Name: employee.name
  // 2. Current Month Upad
  const currentMonthUpad = empUpadTxs
    .filter((t) => t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0)

  // 3. Current Month Salary Paid
  const currentMonthSalaryPaid = empSalaries
    .filter((s) => s.date.startsWith(currentMonthPrefix))
    .reduce((sum, s) => sum + s.paidAmount, 0)

  // 4. Total Lifetime Upad
  const totalLifetimeUpad = empUpadTxs.reduce((sum, t) => sum + t.amount, 0)

  // 5. Total Lifetime Salary Paid
  const totalLifetimeSalaryPaid = empSalaries.reduce((sum, s) => sum + s.paidAmount, 0)

  // 6. Last Salary Amount
  const lastSalaryRecord = empSalaries[empSalaries.length - 1]
  const lastSalaryAmount = lastSalaryRecord ? lastSalaryRecord.paidAmount : 0

  // 7. Last Upad Amount
  const sortedUpadTxs = [...empUpadTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const lastUpadRecord = sortedUpadTxs[sortedUpadTxs.length - 1]
  const lastUpadAmount = lastUpadRecord ? lastUpadRecord.amount : 0

  // 8. Pending Salary
  const pendingSalaryTotal = empSalaries.reduce((sum, s) => sum + s.remainingAmount, 0)

  // Consolidated timeline: both Salary Records and Upad Transactions
  const fullTimeline = [
    ...empSalaries.map((s) => ({
      id: s.id,
      type: "Salary",
      title: `${s.month} ${s.year} Salary Payment`,
      date: s.date,
      amount: s.paidAmount,
      paymentMethod: s.paymentMethod || "Cash",
      notes: s.notes || "",
      status: s.status,
    })),
    ...empUpadTxs.map((t) => {
      let method = t.paymentMethod
      if (!method) {
        const descLower = (t.description || "").toLowerCase()
        if (descLower.includes("gpay") || descLower.includes("upi")) {
          method = "GPay"
        } else if (descLower.includes("bank transfer")) {
          method = "Bank Transfer"
        } else {
          method = "Cash"
        }
      }
      return {
        id: t.id,
        type: "Upad",
        title: "Upad Advance Given",
        date: t.date,
        amount: t.amount,
        paymentMethod: method,
        notes: t.notes || t.description,
        status: "Paid",
      }
    })
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  // Apply filters to timeline
  const filteredTimeline = fullTimeline.filter((item) => {
    if (activeType === "Salary Only" && item.type !== "Salary") return false
    if (activeType === "Upad Only" && item.type !== "Upad") return false
    if (activeDateFrom && new Date(item.date || 0) < new Date(activeDateFrom)) return false
    if (activeDateTo && new Date(item.date || 0) > new Date(activeDateTo)) return false
    return true
  })

  // Save changes
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    await updateEmployee(id, {
      name: editName.trim(),
      role: editRole,
      status: editStatus
    })

    await loadData()
    setActiveDialog(null)
  }

  // ADD UPAD
  const handleAddUpad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUpadHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const amount = parseFloat(inputUpadAmount)
    if (isNaN(amount) || amount <= 0) return

    await createUpad({
      employeeId: id,
      amount,
      date: inputUpadDate,
      description: inputUpadRemarks.trim() || `Issued Upad Advance (${inputUpadMethod})`,
      paymentMethod: inputUpadMethod,
      notes: inputUpadRemarks.trim(),
      handledBy: inputUpadHandledBy
    })

    await loadData()
    setActiveDialog(null)
    setInputUpadAmount("")
    setInputUpadRemarks("")
    setInputUpadHandledBy("")
  }

  // PAY SALARY
  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputSalaryHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const salaryVal = parseFloat(inputSalaryAmount)
    const paidVal = parseFloat(inputSalaryPaid)
    if (isNaN(salaryVal) || salaryVal <= 0 || isNaN(paidVal) || paidVal < 0) return

    await createSalary({
      employeeId: id,
      month: inputSalaryMonth,
      year: inputSalaryYear,
      salaryAmount: salaryVal,
      paidAmount: paidVal,
      notes: inputSalaryRemarks.trim() || `${inputSalaryMonth} ${inputSalaryYear} salary payment processed`,
      date: inputSalaryDate,
      paymentMethod: inputSalaryMethod,
      handledBy: inputSalaryHandledBy
    })

    await loadData()
    setActiveDialog(null)
    setInputSalaryAmount("")
    setInputSalaryPaid("")
    setInputSalaryRemarks("")
    setInputSalaryHandledBy("")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">
        
        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/employees" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Employee Financial Profile Ledger</h1>
            <p className="text-xs text-muted-foreground">Complete account statement and workflow ledger</p>
          </div>
        </header>

        {/* Profile Financials Screen */}
        <section className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{employee.name}</h2>
                <p className="text-xs text-indigo-200 mt-1 font-semibold">Role: {employee.role}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                employee.status === "active" 
                  ? "bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/30" 
                  : "bg-white/10 text-white/70"
              }`}>
                {employee.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5 mt-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Current Month Upad</p>
                <p className="text-lg font-black text-orange-400 mt-0.5">₹{currentMonthUpad.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Current Month Salary Paid</p>
                <p className="text-lg font-black text-emerald-400 mt-0.5">₹{currentMonthSalaryPaid.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Total Lifetime Upad</p>
                <p className="text-lg font-black text-orange-400 mt-0.5">₹{totalLifetimeUpad.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Total Lifetime Salary Paid</p>
                <p className="text-lg font-black text-emerald-400 mt-0.5">₹{totalLifetimeSalaryPaid.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Last Upad Amount</p>
                <p className="text-lg font-black text-orange-300 mt-0.5">₹{lastUpadAmount.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Last Salary Amount</p>
                <p className="text-lg font-black text-emerald-300 mt-0.5">₹{lastSalaryAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="col-span-2 border-t border-white/10 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/60">Pending Salary</p>
                <p className="text-xl font-black text-rose-400 mt-0.5">₹{pendingSalaryTotal.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Grid */}
        <section className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveDialog("addUpad")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95"
          >
            <HandCoins className="h-5 w-5 text-[#ea580c]" />
            <span className="text-[11px] font-bold text-foreground">Add Upad</span>
          </button>

          <button
            onClick={() => setActiveDialog("paySalary")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95"
          >
            <Wallet className="h-5 w-5 text-[#16a34a]" />
            <span className="text-[11px] font-bold text-foreground">Pay Salary</span>
          </button>

          <button
            onClick={() => setActiveDialog("editEmployee")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/60 transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-95"
          >
            <Edit3 className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-bold text-foreground">Edit Staff</span>
          </button>
        </section>

        {/* Filters Section */}
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ledger Filters</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Date From</label>
              <input
                type="date"
                value={inputDateFrom}
                onChange={(e) => setInputDateFrom(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Date To</label>
              <input
                type="date"
                value={inputDateTo}
                onChange={(e) => setInputDateTo(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground">Transaction Type</label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
            >
              <option value="All">All Transactions</option>
              <option value="Salary Only">Salary Only</option>
              <option value="Upad Only">Upad Only</option>
            </select>
          </div>
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleApplyFilters}
              className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-transform active:scale-95"
            >
              Apply Filter
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-1 rounded-xl bg-secondary py-2.5 text-xs font-bold text-secondary-foreground shadow-xs transition-transform active:scale-95 hover:bg-secondary/80"
            >
              Reset Filter
            </button>
          </div>
        </section>

        {/* Financial Details Timeline and History */}
        <div className="flex flex-col gap-6">
          {/* Employee Ledger list */}
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-foreground px-1">Employee Ledger</h3>
            {filteredTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60">
                <p className="text-xs text-muted-foreground">No transaction entries found for the selected filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTimeline.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 p-4 bg-card rounded-2xl ring-1 ring-border/60 shadow-sm text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">{item.date}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.type === "Salary" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                          : "bg-orange-50 text-orange-700 ring-1 ring-[#ea580c]/20 dark:bg-orange-950/30 dark:text-orange-400"
                      }`}>
                        {(item.type || "").toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-border/40 pt-2.5">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</span>
                        <p className="text-base font-black text-foreground mt-0.5">₹{(item.amount || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
                        <p className={`text-xs font-bold mt-0.5 ${
                          item.status === "Paid" ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500"
                        }`}>{item.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-2.5 text-[10px] font-semibold text-muted-foreground">
                      <div>
                        <span className="uppercase tracking-wider">Payment Method</span>
                        <p className="text-foreground text-[11px] font-bold mt-0.5">{item.paymentMethod}</p>
                      </div>
                      <div>
                        <span className="uppercase tracking-wider">Notes</span>
                        <p className="text-foreground text-[11px] font-medium mt-0.5 line-clamp-2">{item.notes || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Salary History */}
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-foreground px-1">Salary History</h3>
            {empSalaries.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">No monthly salary logs found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {empSalaries.map((s) => (
                  <div key={s.id} className="bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs text-xs font-semibold">
                    <div className="flex justify-between items-center mb-2 border-b border-border/40 pb-1.5">
                      <span className="font-bold text-foreground">{s.month} {s.year}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === "Paid" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                      }`}>{s.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Salary: ₹{s.salaryAmount}</span>
                      <span className="text-emerald-600 font-bold">Paid: ₹{s.paidAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upad History */}
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-foreground px-1">Upad History</h3>
            {empUpadTxs.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">No upad logs found.</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-sm text-xs font-semibold">
                {empUpadTxs.map((t) => (
                  <div key={t.id} className="flex justify-between items-center py-2 border-b border-border/40 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-foreground font-bold">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Date: {t.date}</p>
                    </div>
                    <p className="text-orange-600 font-black">₹{t.amount.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>

      {/* Dialog Modals */}
      {/* 1. Edit Employee Modal */}
      {activeDialog === "editEmployee" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Edit Employee</h3>
              <button onClick={() => setActiveDialog(null)} className="h-8 w-8 hover:bg-muted rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleEditEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Employee Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setActiveDialog(null)} className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground transition-all active:scale-95 hover:opacity-95">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Upad Modal */}
      {activeDialog === "addUpad" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Add Upad Advance</h3>
              <button onClick={() => setActiveDialog(null)} className="h-8 w-8 hover:bg-muted rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleAddUpad} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1000"
                    value={inputUpadAmount}
                    onChange={(e) => setInputUpadAmount(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Method</label>
                  <select
                    value={inputUpadMethod}
                    onChange={(e) => setInputUpadMethod(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
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
                  <label className="text-xs font-bold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    required
                    value={inputUpadDate}
                    onChange={(e) => setInputUpadDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Handled By *</label>
                  <select
                    required
                    value={inputUpadHandledBy}
                    onChange={(e) => setInputUpadHandledBy(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  >
                    <option value="" disabled>Select Partner</option>
                    <option value="Rajubhai">Rajubhai</option>
                    <option value="Dhruveshbhai">Dhruveshbhai</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Personal emergency advance"
                  value={inputUpadRemarks}
                  onChange={(e) => setInputUpadRemarks(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setActiveDialog(null)} className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 rounded-2xl bg-[#ea580c] py-3 text-xs font-bold text-white transition-all active:scale-95 hover:opacity-95">Save Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Pay Salary Modal */}
      {activeDialog === "paySalary" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Record Salary Payment</h3>
              <button onClick={() => setActiveDialog(null)} className="h-8 w-8 hover:bg-muted rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handlePaySalary} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Month</label>
                  <select
                    value={inputSalaryMonth}
                    onChange={(e) => setInputSalaryMonth(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  >
                    {getRecentMonthsOptions(6).map((opt) => (
                      <option key={opt.key} value={opt.monthName}>{opt.monthName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Year</label>
                  <select
                    value={inputSalaryYear}
                    onChange={(e) => setInputSalaryYear(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  >
                    {Array.from(new Set(getRecentMonthsOptions(6).map(opt => opt.year))).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Calculated Salary (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20000"
                    value={inputSalaryAmount}
                    onChange={(e) => setInputSalaryAmount(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Paid Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 18000"
                    value={inputSalaryPaid}
                    onChange={(e) => setInputSalaryPaid(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={inputSalaryDate}
                    onChange={(e) => setInputSalaryDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Handled By *</label>
                  <select
                    required
                    value={inputSalaryHandledBy}
                    onChange={(e) => setInputSalaryHandledBy(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                  >
                    <option value="" disabled>Select Partner</option>
                    <option value="Rajubhai">Rajubhai</option>
                    <option value="Dhruveshbhai">Dhruveshbhai</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                <select
                  value={inputSalaryMethod}
                  onChange={(e) => setInputSalaryMethod(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="GPay">GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Stitching pieces output wage sheet"
                  value={inputSalaryRemarks}
                  onChange={(e) => setInputSalaryRemarks(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setActiveDialog(null)} className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 rounded-2xl bg-[#16a34a] py-3 text-xs font-bold text-white transition-all active:scale-95 hover:opacity-95">Record Wage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
