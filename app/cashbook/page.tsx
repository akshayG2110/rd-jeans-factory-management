"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft 
} from "lucide-react"
import { getStoredData, type CashBookRecord } from "@/lib/employee-store"

const CATEGORIES = [
  "Income",
  "Expense",
  "Salary Payment",
  "Upad Payment",
  "Partner Transaction",
  "Other Transaction"
] as const

const TRANSACTION_TYPES = [
  "Income",
  "Salary",
  "Upad",
  "Material Expense",
  "Transport Expense",
  "Electricity",
  "Rent",
  "Other Expense"
] as const

const PAYMENT_METHODS = ["Cash", "GPay", "Bank Transfer", "Cheque"] as const
const HANDLED_BY_OPTIONS = ["Rajubhai", "Dhruveshbhai"] as const

export default function CashBookPage() {
  const [mounted, setMounted] = useState(false)
  const [cashBook, setCashBook] = useState<CashBookRecord[]>([])

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [filterMethod, setFilterMethod] = useState("All")

  const [activeSearch, setActiveSearch] = useState("")
  const [activeDateFrom, setActiveDateFrom] = useState("")
  const [activeDateTo, setActiveDateTo] = useState("")
  const [activeType, setActiveType] = useState("All")
  const [activeMethod, setActiveMethod] = useState("All")

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      const data = await getStoredData()
      setCashBook(data.cashBook || [])
    }
    loadData()
  }, [])

  const handleApplyFilters = () => {
    setActiveSearch(searchQuery)
    setActiveDateFrom(filterDateFrom)
    setActiveDateTo(filterDateTo)
    setActiveType(filterType)
    setActiveMethod(filterMethod)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setFilterType("All")
    setFilterMethod("All")
    setActiveSearch("")
    setActiveDateFrom("")
    setActiveDateTo("")
    setActiveType("All")
    setActiveMethod("All")
  }

  // Passbook chronological calculations (June opening balance is 200000)
  const chronologicalTxs = [...cashBook].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
  let runningBal = 0
  const passbookRows = chronologicalTxs.map((tx) => {
    const isIncome = tx.type === "Money In"
    const amount = tx.amount
    if (isIncome) {
      runningBal += amount
    } else {
      runningBal -= amount
    }

    // Determine payment method from keywords or property
    let method = tx.paymentMethod || "Cash"
    if (!tx.paymentMethod) {
      const lowerText = ((tx.remarks || "") + " " + (tx.refNo || "") + " " + (tx.partyName || "")).toLowerCase()
      if (lowerText.includes("gpay") || lowerText.includes("upi")) {
        method = "GPay"
      } else if (lowerText.includes("bank") || lowerText.includes("transfer") || lowerText.includes("online")) {
        method = "Bank Transfer"
      } else if (lowerText.includes("cheque")) {
        method = "Cheque"
      }
    }

    // Determine Handled By
    let handledBy = tx.handledBy || "Unknown"

    // Determine classification type for filter options
    let displayType = "Other Expense"
    if (tx.category === "Income") {
      displayType = "Income"
    } else if (tx.category === "Salary Payment") {
      displayType = "Salary"
    } else if (tx.category === "Upad Payment") {
      displayType = "Upad"
    } else if (tx.type === "Money Out") {
      const lowerText = ((tx.remarks || "") + " " + (tx.partyName || "")).toLowerCase()
      if (lowerText.includes("material")) displayType = "Material Expense"
      else if (lowerText.includes("electricity") || lowerText.includes("electric") || lowerText.includes("power")) displayType = "Electricity"
      else if (lowerText.includes("transport") || lowerText.includes("lorry") || lowerText.includes("freight")) displayType = "Transport Expense"
      else if (lowerText.includes("rent")) displayType = "Rent"
    }

    return {
      ...tx,
      paymentMethod: method,
      income: isIncome ? amount : null,
      out: !isIncome ? amount : null,
      balance: tx.balance !== undefined ? tx.balance : runningBal,
      displayType,
      handledBy
    }
  })

  // Filter passbook rows based on active filters
  const filteredRows = passbookRows.filter((tx) => {
    if (activeSearch) {
      const query = activeSearch.toLowerCase()
      const matchesSearch = (tx.partyName || "").toLowerCase().includes(query) || 
                            (tx.remarks || "").toLowerCase().includes(query) ||
                            (tx.refNo || "").toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    if (activeType !== "All") {
      // Map filter options to displayTypes
      if (activeType === "Material" && tx.displayType !== "Material Expense") return false
      if (activeType === "Transport" && tx.displayType !== "Transport Expense") return false
      if (activeType !== "Material" && activeType !== "Transport" && tx.displayType !== activeType) return false
    }
    if (activeDateFrom && new Date(tx.date || 0) < new Date(activeDateFrom)) return false
    if (activeDateTo && new Date(tx.date || 0) > new Date(activeDateTo)) return false
    if (activeMethod !== "All" && tx.paymentMethod !== activeMethod) return false

    return true
  }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) // Show latest first

  // Summary Metrics based on filtered list
  const totalInflow = filteredRows
    .filter((tx) => tx.income !== null)
    .reduce((sum, tx) => sum + (tx.income || 0), 0)

  const totalOutflow = filteredRows
    .filter((tx) => tx.out !== null)
    .reduce((sum, tx) => sum + (tx.out || 0), 0)

  // Current Factory Balance
  const currentCashBalance = passbookRows.length > 0 ? passbookRows[passbookRows.length - 1].balance : 0

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 pb-24">
        
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Factory Cash Flow Management</h1>
              <p className="text-xs text-muted-foreground font-medium">Complete Cash Book Passbook Statement</p>
            </div>
          </div>
        </header>

        {/* Filters & Search */}
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Passbook Filters</h3>
          
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search party, remarks, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-secondary py-2.5 pr-4 pl-10 text-xs text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              >
                <option value="All">All Types</option>
                <option value="Income">Income</option>
                <option value="Salary">Salary</option>
                <option value="Upad">Upad</option>
                <option value="Material">Material</option>
                <option value="Transport">Transport</option>
                <option value="Electricity">Electricity</option>
                <option value="Rent">Rent</option>
                <option value="Other Expense">Other Expense</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground">Payment Method</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="GPay">GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
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

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Scale className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Current Cash Balance</p>
              <p className="text-lg font-bold text-foreground">₹{currentCashBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Income</p>
              <p className="text-lg font-bold text-foreground">₹{totalInflow.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Expense</p>
              <p className="text-lg font-bold text-foreground">₹{totalOutflow.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Passbook Table Section (Desktop) */}
        <section className="hidden md:block rounded-3xl bg-card p-6 shadow-md ring-1 ring-border/60">
          <h2 className="text-lg font-bold text-foreground px-1 mb-4">Passbook Statements</h2>
          {filteredRows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No passbook records found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-xs font-semibold text-muted-foreground">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-foreground bg-muted/20">
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Name</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Income</th>
                    <th className="py-3 px-4 font-bold">Out</th>
                    <th className="py-3 px-4 font-bold">Balance</th>
                    <th className="py-3 px-4 font-bold">Partner</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 hover:bg-muted/40">
                      <td className="py-3 px-4 text-foreground">
                        {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-foreground font-bold">{row.partyName}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.paymentMethod}</td>
                      <td className="py-3 px-4 text-emerald-600 font-extrabold">
                        {row.income ? `₹${row.income.toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-rose-500 font-extrabold">
                        {row.out ? `₹${row.out.toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground font-black">
                        ₹{row.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.handledBy}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.category}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Mobile View Cards */}
        <section className="flex md:hidden flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Ledger Passbook</h2>
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No passbook records found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredRows.map((row) => (
                <div key={row.id} className="flex flex-col gap-3 p-4 bg-card rounded-2xl ring-1 ring-border/60 shadow-sm text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                        {row.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border/40 pt-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Particular</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">{row.partyName}</p>
                    </div>
                    <div className="text-right">
                      {row.income ? (
                        <>
                          <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Income</span>
                          <p className="text-sm font-black text-emerald-600 mt-0.5">+₹{row.income.toLocaleString("en-IN")}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Out</span>
                          <p className="text-sm font-black text-red-500 mt-0.5">-₹{row.out?.toLocaleString("en-IN")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-2.5 text-[10px] font-semibold text-muted-foreground">
                    <div>
                      <span className="uppercase tracking-wider">Running Balance</span>
                      <p className="text-foreground text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">₹{row.balance.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider">Notes</span>
                      <p className="text-foreground text-[11px] font-medium mt-0.5 line-clamp-2">{row.remarks}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/40 pt-2 text-[9px] text-muted-foreground">
                    <span>Partner: <span className="font-bold text-foreground">{row.handledBy}</span></span>
                    <span>Category: <span className="font-bold text-foreground">{row.category}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
