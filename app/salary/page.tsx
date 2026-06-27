"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  X, 
  Edit, 
  Eye, 
  TrendingUp, 
  UserCheck 
} from "lucide-react"
import { getStoredData, createSalary, updateSalary, type Employee, type SalaryRecord, type Transaction } from "@/lib/employee-store"

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
]

const YEARS = ["2025", "2026", "2027"]

export default function SalaryPage() {
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  
  const currentDate = new Date()
  const currentMonthNum = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const currentMonthName = MONTHS[currentMonthNum - 1]

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  // Form Fields
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formMonth, setFormMonth] = useState(currentMonthName)
  const [formYear, setFormYear] = useState(String(currentYear))
  const [formSalaryAmount, setFormSalaryAmount] = useState("")
  const [formPaidAmount, setFormPaidAmount] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formHandledBy, setFormHandledBy] = useState<string>("")
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Cash")

  const loadData = async () => {
    const data = await getStoredData()
    setEmployees(data.employees || [])
    setTransactions(data.transactions || [])
    setSalaryRecords(data.salaryRecords || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  useEffect(() => {
    if (employees.length > 0 && !formEmployeeId) {
      setFormEmployeeId(employees[0].id)
      setFormSalaryAmount(employees[0].salary.toString())
      setFormPaidAmount(employees[0].salary.toString())
    }
  }, [employees])

  const handleEmployeeChange = (empId: string) => {
    setFormEmployeeId(empId)
    const emp = employees.find((e) => e.id === empId)
    if (emp) {
      setFormSalaryAmount(emp.salary.toString())
      setFormPaidAmount(emp.salary.toString())
    }
  }

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingRecordId(null)
    if (employees.length > 0) {
      setFormEmployeeId(employees[0].id)
      setFormSalaryAmount(employees[0].salary.toString())
      setFormPaidAmount(employees[0].salary.toString())
    }
    const curDate = new Date()
    const curMonthNum = curDate.getMonth() + 1
    const curYear = curDate.getFullYear()
    const curMonthName = MONTHS[curMonthNum - 1]
    setFormMonth(curMonthName)
    setFormYear(String(curYear))
    setFormNotes("")
    setFormHandledBy("")
    setFormPaymentMethod("Cash")
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (record: SalaryRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingRecordId(record.id)
    setFormEmployeeId(record.employeeId)
    setFormMonth(record.month)
    setFormYear(record.year)
    setFormSalaryAmount(record.salaryAmount.toString())
    setFormPaidAmount(record.paidAmount.toString())
    setFormNotes(record.notes)
    setFormHandledBy(record.handledBy || "Rajubhai")
    setFormPaymentMethod(record.paymentMethod || "Cash")
    setIsDialogOpen(true)
  }

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formHandledBy) {
      alert("Please select a partner (Handled By).")
      return
    }
    const salaryAmt = parseFloat(formSalaryAmount)
    const paidAmt = parseFloat(formPaidAmount)

    if (isNaN(salaryAmt) || isNaN(paidAmt) || salaryAmt < 0 || paidAmt < 0) return

    const selectedEmp = employees.find((emp) => emp.id === formEmployeeId)
    if (!selectedEmp) return

    if (dialogMode === "add") {
      await createSalary({
        employeeId: formEmployeeId,
        month: formMonth,
        year: formYear,
        salaryAmount: salaryAmt,
        paidAmount: paidAmt,
        notes: formNotes || `${formMonth} ${formYear} salary entry`,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: formPaymentMethod,
        handledBy: formHandledBy
      })
    } else if (dialogMode === "edit" && editingRecordId) {
      await updateSalary(editingRecordId, {
        month: formMonth,
        year: formYear,
        salaryAmount: salaryAmt,
        paidAmount: paidAmt,
        notes: formNotes,
        paymentMethod: formPaymentMethod,
        handledBy: formHandledBy,
        date: new Date().toISOString().split("T")[0]
      })
    }

    await loadData()
    setIsDialogOpen(false)
  }

  // Filter records based on criteria
  const activeRecords = salaryRecords.filter((rec) => {
    const matchesSearch = (rec.employeeName || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    const matchesMonth = rec.month === selectedMonth
    const matchesYear = rec.year === selectedYear
    return matchesSearch && matchesMonth && matchesYear
  })

  // Calculations for current selection
  const monthlySalaryTotal = activeRecords.reduce((acc, curr) => acc + curr.salaryAmount, 0)
  const paidSalary = activeRecords.reduce((acc, curr) => acc + curr.paidAmount, 0)
  const pendingSalary = activeRecords.reduce((acc, curr) => acc + curr.remainingAmount, 0)
  const employeesPaid = activeRecords.filter((rec) => rec.status === "Paid").length

  // Recent 5 transactions
  const recentPayments = transactions
    .filter((tx) => tx.type === "salary")
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Salary Management</h1>
              <p className="text-xs text-muted-foreground">Employee salary records</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Pay Salary</span>
          </button>
        </header>

        {/* Statistics Section */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Salary Total</p>
              <p className="text-lg font-bold text-foreground">₹{monthlySalaryTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Paid Salary</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{paidSalary.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Pending Salary</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">₹{pendingSalary.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
              <UserCheck className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Employees Paid</p>
              <p className="text-lg font-bold text-foreground">
                {employeesPaid} <span className="text-xs text-muted-foreground">/ {activeRecords.length}</span>
              </p>
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Salary List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Salary Records ({selectedMonth} {selectedYear})</h2>
          
          {activeRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No salary records found for {selectedMonth} {selectedYear}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base leading-tight">{rec.employeeName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground font-semibold">{rec.role}</p>
                    </div>

                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      rec.status === "Paid" 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : rec.status === "Partially Paid"
                        ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400"
                        : "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400"
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Salary</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">₹{(rec.salaryAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Paid</p>
                      <p className="text-xs font-bold text-[#16a34a] mt-0.5">₹{(rec.paidAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase font-bold text-right">Remaining</p>
                      <p className="text-xs font-bold text-[#ea580c] mt-0.5 text-right">₹{(rec.remainingAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                    <Link
                      href={`/salary/${rec.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={(e) => handleOpenEditDialog(rec, e)}
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

        {/* Recent Salary Payments Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Payments</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent payments found.</p>
            ) : (
              recentPayments.map((tx, idx) => {
                const emp = employees.find((e) => e.id === tx.employeeId)
                return (
                  <div 
                    key={tx.id} 
                    className={`flex items-center justify-between pb-3 ${idx < recentPayments.length - 1 ? 'border-b border-border/50' : ''} pt-2.5`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{emp ? emp.name : "Employee"}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{tx.date}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(tx.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>

      {/* Pay Salary Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Pay Monthly Salary" : "Edit Salary Record"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="flex flex-col gap-4">
              {dialogMode === "add" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Employee Dropdown</label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-muted-foreground">Employee</label>
                  <p className="text-sm font-bold text-foreground px-1 py-1">
                    {employees.find((e) => e.id === formEmployeeId)?.name}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Salary Month</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Salary Year</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
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
                  placeholder="e.g. 18000"
                  value={formSalaryAmount}
                  onChange={(e) => setFormSalaryAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Paid Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={formPaidAmount}
                  onChange={(e) => setFormPaidAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Full payment processed via bank"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#16a34a] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95"
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
