"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale 
} from "lucide-react"
import { getStoredData, type CashBookRecord } from "@/lib/employee-store"

export default function PartnersPage() {
  const [mounted, setMounted] = useState(false)
  const [cashBook, setCashBook] = useState<CashBookRecord[]>([])

  // View States (All, Rajubhai, Dhruveshbhai)
  const [activeView, setActiveView] = useState<"All" | "Rajubhai" | "Dhruveshbhai">("All")

  // Filter States
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterType, setFilterType] = useState("All")

  const [activeDateFrom, setActiveDateFrom] = useState("")
  const [activeDateTo, setActiveDateTo] = useState("")
  const [activeType, setActiveType] = useState("All")

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setCashBook(data.cashBook || [])
  
    };
    loadData();
}, [])

  const handleApplyFilters = () => {
    setActiveDateFrom(filterDateFrom)
    setActiveDateTo(filterDateTo)
    setActiveType(filterType)
  }

  const handleResetFilters = () => {
    setFilterDateFrom("")
    setFilterDateTo("")
    setFilterType("All")
    setActiveDateFrom("")
    setActiveDateTo("")
    setActiveType("All")
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

    // Determine payment method from keywords
    let method = "Cash"
    const lowerText = ((tx.remarks || "") + " " + (tx.refNo || "") + " " + (tx.partyName || "")).toLowerCase()
    if (lowerText.includes("gpay") || lowerText.includes("upi")) {
      method = "GPay"
    } else if (lowerText.includes("bank") || lowerText.includes("transfer") || lowerText.includes("online")) {
      method = "Bank Transfer"
    }

    // Determine classification type for filter options
    let displayType = "Other Expense"
    if (tx.category === "Income") {
      displayType = "Income"
    } else if (tx.category === "Salary Payment") {
      displayType = "Salary"
    } else if (tx.category === "Upad Payment") {
      displayType = "Upad"
    } else if (tx.type === "Money Out") {
      if (lowerText.includes("material")) displayType = "Material"
      else if (lowerText.includes("electricity") || lowerText.includes("electric") || lowerText.includes("power")) displayType = "Electricity"
      else if (lowerText.includes("transport") || lowerText.includes("lorry") || lowerText.includes("freight")) displayType = "Transport"
      else if (lowerText.includes("rent")) displayType = "Rent"
    }

    return {
      id: tx.id,
      date: tx.date,
      name: tx.partyName || "Unknown",
      paymentMethod: method,
      income: isIncome ? amount : null,
      out: !isIncome ? amount : null,
      balance: tx.balance !== undefined ? tx.balance : runningBal,
      notes: tx.remarks || tx.category || "-",
      displayType,
      handledBy: tx.handledBy || "Unknown"
    }
  })

  // Filter passbook rows based on active view and secondary filters
  const viewFilteredRows = passbookRows.filter((tx) => {
    // 1. View Tab Filter (Rajubhai / Dhruveshbhai)
    if (activeView === "Rajubhai" && tx.handledBy !== "Rajubhai") return false
    if (activeView === "Dhruveshbhai" && tx.handledBy !== "Dhruveshbhai") return false

    // 2. Secondary Type Filter
    if (activeType !== "All" && tx.displayType !== activeType) return false

    // 3. Secondary Date Filter
    if (activeDateFrom && new Date(tx.date || 0) < new Date(activeDateFrom)) return false
    if (activeDateTo && new Date(tx.date || 0) > new Date(activeDateTo)) return false

    return true
  }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) // Show latest first

  // Summary Metrics based on filtered list
  const totalInflow = viewFilteredRows
    .filter((tx) => tx.income !== null)
    .reduce((sum, tx) => sum + (tx.income || 0), 0)

  const totalOutflow = viewFilteredRows
    .filter((tx) => tx.out !== null)
    .reduce((sum, tx) => sum + (tx.out || 0), 0)

  // Current Factory Balance (Grand Cash Position)
  const currentFactoryBalance = passbookRows.length > 0 ? passbookRows[passbookRows.length - 1].balance : 0

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Partner Balance Register</h1>
              <p className="text-xs text-muted-foreground">Complete factory financial movement statement</p>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Inflow</p>
              <p className="text-lg font-bold text-foreground">₹{totalInflow.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Outflow</p>
              <p className="text-lg font-bold text-foreground">₹{totalOutflow.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Scale className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Current Factory Balance</p>
              <p className="text-lg font-bold text-foreground">₹{currentFactoryBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs */}
        <section className="flex rounded-2xl bg-card p-1 shadow-xs ring-1 ring-border/60">
          <button
            onClick={() => setActiveView("All")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeView === "All" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setActiveView("Rajubhai")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeView === "Rajubhai" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Rajubhai View
          </button>
          <button
            onClick={() => setActiveView("Dhruveshbhai")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeView === "Dhruveshbhai" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Dhruveshbhai View
          </button>
        </section>

        {/* Filters Section */}
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statement Filters</h3>
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
              <option value="Electricity">Electricity</option>
              <option value="Transport">Transport</option>
              <option value="Rent">Rent</option>
              <option value="Other Expense">Other Expense</option>
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

        {/* Desktop View Table */}
        <section className="hidden md:block rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
          <h2 className="text-base font-bold text-foreground px-1 mb-4">Passbook statements</h2>
          {viewFilteredRows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No passbook records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold text-muted-foreground">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Name</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Income</th>
                    <th className="py-3 px-4 font-bold">Out</th>
                    <th className="py-3 px-4 font-bold">Balance</th>
                    <th className="py-3 px-4 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {viewFilteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 hover:bg-muted/40">
                      <td className="py-3 px-4 text-foreground">
                        {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-foreground font-bold">{row.name}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.paymentMethod}</td>
                      <td className="py-3 px-4 text-emerald-600 font-extrabold">
                        {row.income ? `₹${row.income.toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-extrabold">
                        {row.out ? `₹${row.out.toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground font-black">
                        ₹{row.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{row.notes}</td>
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
          {viewFilteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No passbook records found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {viewFilteredRows.map((row) => (
                <div key={row.id} className="flex flex-col gap-3 p-4 bg-card rounded-2xl ring-1 ring-border/60 shadow-sm text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[11px] font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                      {row.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border/40 pt-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Particular</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">{row.name}</p>
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
                      <p className="text-foreground text-[11px] font-bold mt-0.5">₹{row.balance.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider">Notes</span>
                      <p className="text-foreground text-[11px] font-medium mt-0.5 line-clamp-2">{row.notes}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border/40 pt-2 text-[9px] text-muted-foreground">
                    <span>Partner: <span className="font-bold text-foreground">{row.handledBy}</span></span>
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
