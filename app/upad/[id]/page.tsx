"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  HandCoins, 
  Wallet, 
  Calendar, 
  PlusCircle, 
  X, 
  Calculator, 
  UserCheck 
} from "lucide-react"
import { getStoredData, createUpad, type Employee, type Transaction } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function UpadDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Modal State for adding Upad directly
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const loadData = async () => {
    const data = await getStoredData()
    setEmployees(data.employees || [])
    setTransactions(data.transactions || [])

    const emp = (data.employees || []).find((e) => e.id === id)
    if (emp) {
      setEmployee(emp)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    setFormDate(new Date().toISOString().split("T")[0])
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

  if (!employee) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Employee advance ledger not found</p>
          <Link href="/upad" className="text-sm font-bold text-[#ea580c] hover:underline">
            Back to Upad Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter Upad Transactions for this Employee
  const upadTimeline = transactions.filter(
    (t) => t.employeeId === id && t.type === "upad"
  )

  const handleAddUpadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(formAmount)
    if (isNaN(amountNum) || amountNum <= 0) return

    await createUpad({
      employeeId: id,
      amount: amountNum,
      date: formDate,
      description: formNotes || "Upad advance given",
      notes: formNotes
    })

    await loadData()
    setIsDialogOpen(false)
    setFormAmount("")
    setFormNotes("")
  }

  // Salary adjustments
  const monthlySalary = employee.salary
  const totalOutstandingUpad = employee.upad
  const remainingPayable = Math.max(0, monthlySalary - totalOutstandingUpad)

  // Status Level
  const upadLvl = totalOutstandingUpad <= 2000 ? "Low" : totalOutstandingUpad <= 5000 ? "Medium" : "High"

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link 
              href="/upad" 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Upad Details</h1>
              <p className="text-xs text-muted-foreground">Detailed employee advance ledger</p>
            </div>
          </div>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#ea580c] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Upad</span>
          </button>
        </header>

        {/* Profile Details Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{employee.name}</h2>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{employee.role}</p>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              upadLvl === "Low" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                : upadLvl === "Medium"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400"
                : "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400"
            }`}>
              {upadLvl} Upad Level
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Total Upad</p>
              <p className="text-base font-bold text-[#ea580c] mt-0.5">₹{totalOutstandingUpad.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Salary</p>
              <p className="text-base font-bold text-foreground mt-0.5">₹{monthlySalary.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Salary Adjustment Section */}
        <section className="flex flex-col gap-3 rounded-[28px] bg-secondary p-6 ring-1 ring-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Salary Adjustment Calculator</h3>
          </div>

          <div className="flex flex-col gap-3 bg-card rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Monthly Salary</span>
              <span className="text-foreground font-bold">₹{monthlySalary.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Outstanding Upad Advance</span>
              <span className="text-[#ea580c] font-bold">- ₹{totalOutstandingUpad.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-foreground">Payable Salary after Adjustment</span>
              <span className="text-sm font-black text-emerald-600">₹{remainingPayable.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        {/* Upad History Section (Timeline View) */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1 flex items-center justify-between">
            <span>Upad History</span>
            <span className="text-[11px] font-medium text-muted-foreground">{upadTimeline.length} entries</span>
          </h3>

          {upadTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No Upad history advances recorded yet.</p>
            </div>
          ) : (
            <div className="relative border-l border-border/70 ml-4 pl-6 flex flex-col gap-5 py-2">
              {upadTimeline.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline circle icon */}
                  <span className="absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ea580c]/10 ring-4 ring-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span>
                  </span>
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-bold text-foreground">{item.description}</p>
                      <p className="text-sm font-extrabold text-[#ea580c] shrink-0">₹{item.amount.toLocaleString("en-IN")}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Add Upad Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Issue Upad Advance</h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleAddUpadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground font-semibold px-0.5">Employee</label>
                <p className="text-sm font-bold text-foreground px-1 py-0.5">{employee.name}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Date Given</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Advance Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Health expense advance"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
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
                  className="flex-1 rounded-2xl bg-[#ea580c] py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-95"
                >
                  Save Button
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
