"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Users, 
  HandCoins, 
  UserCheck, 
  X, 
  Edit, 
  Eye,
  Wallet
} from "lucide-react"
import { getStoredData, createEmployee, updateEmployee, type Employee } from "@/lib/employee-store"

const ROLE_OPTIONS: Employee["role"][] = [
  "Stitching Worker",
  "Cutting Worker",
  "Helper",
  "Indoor Staff",
  "Outdoor Staff",
  "Supervisor",
]

export default function EmployeesPage() {
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [salaryRecords, setSalaryRecords] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  
  // Form States
  const [formName, setFormName] = useState("")
  const [formRole, setFormRole] = useState<Employee["role"]>("Stitching Worker")
  const [formStatus, setFormStatus] = useState<Employee["status"]>("active")

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

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setSelectedEmployeeId(null)
    setFormName("")
    setFormRole("Stitching Worker")
    setFormStatus("active")
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setSelectedEmployeeId(employee.id)
    setFormName(employee.name)
    setFormRole(employee.role)
    setFormStatus(employee.status)
    setIsDialogOpen(true)
  }

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    if (dialogMode === "add") {
      await createEmployee({
        name: formName.trim(),
        role: formRole,
        status: "active"
      })
    } else if (dialogMode === "edit" && selectedEmployeeId) {
      await updateEmployee(selectedEmployeeId, {
        name: formName.trim(),
        role: formRole,
        status: formStatus
      })
    }

    await loadData()
    setIsDialogOpen(false)
  }

  const currentDateObj = new Date()
  const yyyy = currentDateObj.getFullYear()
  const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0')
  const currentMonthPrefix = `${yyyy}-${mm}`

  // Calculated Stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.status === "active").length
  
  const currentMonthUpadTotal = transactions.reduce((acc, tx) => {
    if (tx.type === "upad" && (tx.date || "").startsWith(currentMonthPrefix)) {
      return acc + tx.amount
    }
    return acc
  }, 0)

  const currentMonthSalaryTotal = salaryRecords.reduce((acc, sal) => {
    if ((sal.date || "").startsWith(currentMonthPrefix)) {
      return acc + sal.paidAmount
    }
    return acc
  }, 0)

  // Filtered List
  const filteredEmployees = employees.filter((emp) =>
    (emp.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  )

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Employees</h1>
              <p className="text-xs text-muted-foreground">Manage factory staff</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-0 bg-card py-3.5 pr-4 pl-11 text-sm text-foreground shadow-sm ring-1 ring-border/60 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Employee Statistics Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Staff</p>
              <p className="text-lg font-bold text-foreground">{totalEmployees}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <UserCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Active Staff</p>
              <p className="text-lg font-bold text-foreground">{activeEmployees}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
              <HandCoins className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Current Month Upad</p>
              <p className="text-lg font-bold text-[#ea580c]">₹{currentMonthUpadTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <Wallet className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Current Month Salary Paid</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{currentMonthSalaryTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Employee List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Employee List</h2>
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No employees found matching &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEmployees.map((emp) => {
                const empMonthUpad = transactions.reduce((acc, tx) => {
                  if (tx.employeeId === emp.id && tx.type === "upad" && (tx.date || "").startsWith(currentMonthPrefix)) {
                    return acc + tx.amount
                  }
                  return acc
                }, 0)

                const empMonthSalaryPaid = salaryRecords.reduce((acc, sal) => {
                  if (sal.employeeId === emp.id && (sal.date || "").startsWith(currentMonthPrefix)) {
                    return acc + sal.paidAmount
                  }
                  return acc
                }, 0)

                return (
                  <div
                    key={emp.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-base leading-tight">{emp.name}</h3>
                        <p className="mt-1.5 text-xs text-muted-foreground font-semibold">
                          Role: <span className="text-foreground">{emp.role}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        emp.status === "active" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Month Upad</p>
                        <p className="text-sm font-bold text-[#ea580c] mt-0.5">₹{empMonthUpad.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Month Salary Paid</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{empMonthSalaryPaid.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joining Date</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{emp.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Financial Profile</span>
                      </Link>
                      <button
                        onClick={(e) => handleOpenEditDialog(emp, e)}
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

      </div>

      {/* Add / Edit Dialog (Popup Modal) */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Add New Employee" : "Edit Employee Details"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Employee["role"])}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {dialogMode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Employee["status"])}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

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
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground transition-all hover:opacity-95 active:scale-95"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
