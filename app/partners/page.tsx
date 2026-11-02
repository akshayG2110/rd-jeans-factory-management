"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale,
  Plus,
  Landmark,
  Wallet,
  Users,
  TrendingUp,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign
} from "lucide-react"
import { 
  getStoredData, 
  fetchPartners, 
  fetchPartnerEquityTransactions, 
  createPartner, 
  createPartnerTransaction, 
  type CashBookRecord, 
  type PartnerAccount, 
  type PartnerTransaction 
} from "@/lib/employee-store"

export default function PartnersPage() {
  const [mounted, setMounted] = useState(false)
  const [cashBook, setCashBook] = useState<CashBookRecord[]>([])
  const [partners, setPartners] = useState<PartnerAccount[]>([])
  const [equityTransactions, setEquityTransactions] = useState<PartnerTransaction[]>([])

  // Mode: "cashbook" (Operational passbook) vs "equity" (Partner Capital & Drawings)
  const [activeLedgerMode, setActiveLedgerMode] = useState<"cashbook" | "equity">("cashbook")

  // Selected Partner: "All" or partner.id
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("All")

  // Filter States for Passbook
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterType, setFilterType] = useState("All")

  const [activeDateFrom, setActiveDateFrom] = useState("")
  const [activeDateTo, setActiveDateTo] = useState("")
  const [activeType, setActiveType] = useState("All")

  // Modals
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false)
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Capital Transaction Form
  const [capPartnerId, setCapPartnerId] = useState("")
  const [capDate, setCapDate] = useState(new Date().toISOString().split("T")[0])
  const [capType, setCapType] = useState<"Capital Investment" | "Drawing (Personal Withdrawal)" | "Profit Share" | "Cash Transfer" | "Adjustment">("Capital Investment")
  const [capAmount, setCapAmount] = useState("")
  const [capMethod, setCapMethod] = useState("Cash")
  const [capNotes, setCapNotes] = useState("")
  const [capSyncCashbook, setCapSyncCashbook] = useState(true)

  // Add Partner Form
  const [newPartnerName, setNewPartnerName] = useState("")
  const [newPartnerMobile, setNewPartnerMobile] = useState("")
  const [newPartnerProfitShare, setNewPartnerProfitShare] = useState("50")
  const [newPartnerOpeningBal, setNewPartnerOpeningBal] = useState("0")
  const [newPartnerNotes, setNewPartnerNotes] = useState("")

  const loadAllData = async () => {
    try {
      const [stored, partnersList, equityList] = await Promise.all([
        getStoredData(),
        fetchPartners(),
        fetchPartnerEquityTransactions()
      ])
      setCashBook(stored.cashBook || [])
      setPartners(partnersList || [])
      setEquityTransactions(equityList || [])
      if (partnersList.length > 0 && !capPartnerId) {
        setCapPartnerId(partnersList[0].id)
      }
    } catch (err) {
      console.error("Error loading partner data", err)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadAllData()
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

  // Selected partner object
  const activePartner = partners.find(p => p.id === selectedPartnerId)

  // Passbook chronological calculations
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
    let method = tx.paymentMethod || "Cash"
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
    } else if (tx.category === "Partner Transaction") {
      displayType = "Partner"
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
  const viewFilteredPassbookRows = passbookRows.filter((tx) => {
    // 1. Partner Tab Filter
    if (selectedPartnerId !== "All") {
      const pName = activePartner?.name
      if (pName && tx.handledBy.toLowerCase() !== pName.toLowerCase()) return false
    }

    // 2. Secondary Type Filter
    if (activeType !== "All" && tx.displayType !== activeType) return false

    // 3. Secondary Date Filter
    if (activeDateFrom && new Date(tx.date || 0) < new Date(activeDateFrom)) return false
    if (activeDateTo && new Date(tx.date || 0) > new Date(activeDateTo)) return false

    return true
  }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) // Show latest first

  // Filter equity transactions based on selected partner
  const viewFilteredEquityRows = equityTransactions.filter((et) => {
    if (selectedPartnerId !== "All" && et.partnerId !== selectedPartnerId) return false
    if (activeDateFrom && new Date(et.date || 0) < new Date(activeDateFrom)) return false
    if (activeDateTo && new Date(et.date || 0) > new Date(activeDateTo)) return false
    return true
  }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  // Summary Metrics based on filtered passbook list
  const totalInflow = viewFilteredPassbookRows
    .filter((tx) => tx.income !== null)
    .reduce((sum, tx) => sum + (tx.income || 0), 0)

  const totalOutflow = viewFilteredPassbookRows
    .filter((tx) => tx.out !== null)
    .reduce((sum, tx) => sum + (tx.out || 0), 0)

  // Current Factory Balance (Grand Cash Position)
  const currentFactoryBalance = passbookRows.length > 0 ? passbookRows[passbookRows.length - 1].balance : 0

  // Handle Capital Transaction Submission
  const handleSaveCapitalTx = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!capPartnerId || !capAmount || parseFloat(capAmount) <= 0) {
      alert("Please enter a valid amount and select a partner.")
      return
    }

    setActionLoading(true)
    try {
      const result = await createPartnerTransaction({
        partnerId: capPartnerId,
        transactionDate: capDate,
        transactionType: capType,
        amount: parseFloat(capAmount),
        paymentMethod: capMethod,
        notes: capNotes,
        syncCashbook: capSyncCashbook
      })

      if (result) {
        setSuccessMessage("Partner capital transaction recorded successfully!")
        setIsCapitalModalOpen(false)
        setCapAmount("")
        setCapNotes("")
        await loadAllData()
        setTimeout(() => setSuccessMessage(""), 4000)
      } else {
        alert("Failed to record capital transaction.")
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Something went wrong"))
    } finally {
      setActionLoading(false)
    }
  }

  // Handle New Partner Creation
  const handleSaveNewPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartnerName.trim()) {
      alert("Please enter partner name.")
      return
    }

    setActionLoading(true)
    try {
      const res = await createPartner({
        name: newPartnerName.trim(),
        mobileNumber: newPartnerMobile.trim() || undefined,
        profitSharePercentage: parseFloat(newPartnerProfitShare) || 50,
        openingBalance: parseFloat(newPartnerOpeningBal) || 0,
        notes: newPartnerNotes.trim() || undefined
      })

      if (res) {
        setSuccessMessage(`Partner ${res.name} created successfully!`)
        setIsPartnerModalOpen(false)
        setNewPartnerName("")
        setNewPartnerMobile("")
        setNewPartnerProfitShare("50")
        setNewPartnerOpeningBal("0")
        setNewPartnerNotes("")
        await loadAllData()
        setTimeout(() => setSuccessMessage(""), 4000)
      } else {
        alert("Failed to create partner.")
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to create partner"))
    } finally {
      setActionLoading(false)
    }
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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6">
        
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Link 
              href="/" 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Partner Balance & Equity</h1>
              <p className="text-xs text-muted-foreground">Capital investments, personal drawings & cash desk ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCapitalModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Record Capital/Drawing</span>
            </button>
            <button
              onClick={() => setIsPartnerModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border/60 shadow-sm transition-transform active:scale-95 hover:bg-muted"
            >
              <Users className="h-4 w-4 text-primary" />
              <span>+ Partner</span>
            </button>
          </div>
        </header>

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Factory Summary Cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedPartnerId === "All" ? "Total Cash Inflow" : `${activePartner?.name} Inflow`}
              </p>
              <p className="text-lg font-bold text-foreground">₹{totalInflow.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedPartnerId === "All" ? "Total Cash Outflow" : `${activePartner?.name} Outflow`}
              </p>
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

        {/* Dynamic Partner Selector Tabs */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Select Partner Account</span>
            <span className="text-[11px] font-semibold text-muted-foreground">{partners.length} Partners Registered</span>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl bg-card p-1.5 shadow-xs ring-1 ring-border/60">
            <button
              onClick={() => setSelectedPartnerId("All")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                selectedPartnerId === "All" 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              All Combined
            </button>
            {partners.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPartnerId(p.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                  selectedPartnerId === p.id 
                    ? "bg-primary text-primary-foreground shadow-xs" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedPartnerId === p.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                  {p.profitSharePercentage}%
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Partner Equity Detailed Breakdown Card (When specific partner selected or summary across all) */}
        {activePartner ? (
          <section className="rounded-3xl bg-linear-to-br from-card to-secondary/30 p-5 shadow-sm ring-1 ring-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Partner Capital Account</span>
                <h3 className="text-xl font-black text-foreground">{activePartner.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Profit Share: <span className="font-bold text-foreground">{activePartner.profitSharePercentage}%</span> • Status: <span className="font-semibold text-emerald-600">{activePartner.status}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Equity Balance</span>
                <p className={`text-2xl font-black ${activePartner.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  ₹{activePartner.currentBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Opening Capital</span>
                <p className="text-sm font-bold text-foreground mt-0.5">₹{activePartner.openingBalance.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Invested</span>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{activePartner.totalInvestment.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Personal Drawings</span>
                <p className="text-sm font-bold text-rose-600 mt-0.5">₹{activePartner.totalWithdrawal.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Net Cash Desk Handled</span>
                <p className="text-sm font-bold text-foreground mt-0.5">₹{(activePartner.netCashHandled ?? 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Partner Capital Equity Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 ring-1 ring-border/30">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                    <span className="text-[11px] text-muted-foreground">{p.profitSharePercentage}% Share</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Equity Balance</span>
                    <p className={`text-sm font-extrabold ${p.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ₹{p.currentBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ledger Mode Switcher: Cashbook vs Equity */}
        <section className="flex rounded-2xl bg-card p-1 shadow-xs ring-1 ring-border/60">
          <button
            onClick={() => setActiveLedgerMode("cashbook")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeLedgerMode === "cashbook" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Operational Cash Passbook</span>
          </button>
          <button
            onClick={() => setActiveLedgerMode("equity")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeLedgerMode === "equity" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>Capital Equity & Drawings ({viewFilteredEquityRows.length})</span>
          </button>
        </section>

        {/* Passbook Filters (Visible only in cashbook mode) */}
        {activeLedgerMode === "cashbook" && (
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
                <option value="Partner">Partner Transaction</option>
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
        )}

        {/* ---------------- CASHBOOK VIEW ---------------- */}
        {activeLedgerMode === "cashbook" && (
          <>
            {/* Desktop View Table */}
            <section className="hidden md:block rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
              <h2 className="text-base font-bold text-foreground px-1 mb-4">Passbook statements</h2>
              {viewFilteredPassbookRows.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No passbook records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-muted-foreground">
                    <thead>
                      <tr className="border-b border-border text-foreground">
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Name</th>
                        <th className="py-3 px-4 font-bold">Method</th>
                        <th className="py-3 px-4 font-bold">Handled By</th>
                        <th className="py-3 px-4 font-bold">Income</th>
                        <th className="py-3 px-4 font-bold">Out</th>
                        <th className="py-3 px-4 font-bold">Balance</th>
                        <th className="py-3 px-4 font-bold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewFilteredPassbookRows.map((row) => (
                        <tr key={row.id} className="border-b border-border/40 hover:bg-muted/40">
                          <td className="py-3 px-4 text-foreground">
                            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-3 px-4 text-foreground font-bold">{row.name}</td>
                          <td className="py-3 px-4 text-foreground font-medium">{row.paymentMethod}</td>
                          <td className="py-3 px-4 text-foreground font-bold">{row.handledBy}</td>
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
              {viewFilteredPassbookRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
                  <p className="text-sm text-muted-foreground">No passbook records found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {viewFilteredPassbookRows.map((row) => (
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
                          <span className="uppercase tracking-wider">Handled By</span>
                          <p className="text-foreground text-[11px] font-bold mt-0.5">{row.handledBy}</p>
                        </div>
                      </div>

                      {row.notes && (
                        <div className="border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                          <span>Notes: <span className="font-medium text-foreground">{row.notes}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ---------------- EQUITY & DRAWINGS VIEW ---------------- */}
        {activeLedgerMode === "equity" && (
          <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Partner Equity Transactions</h2>
                <p className="text-xs text-muted-foreground">Capital investments, personal drawings, and profit distributions</p>
              </div>
              <button
                onClick={() => setIsCapitalModalOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-transform active:scale-95 hover:bg-primary/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            {viewFilteredEquityRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-12 px-4 text-center">
                <Landmark className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">No capital transactions recorded</p>
                <p className="text-xs text-muted-foreground mt-1">Use the "Record Capital/Drawing" button to log an investment or withdrawal.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-muted-foreground">
                    <thead>
                      <tr className="border-b border-border text-foreground">
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Partner</th>
                        <th className="py-3 px-4 font-bold">Type</th>
                        <th className="py-3 px-4 font-bold">Method</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewFilteredEquityRows.map((et) => {
                        const isPositive = et.type === "Capital Investment" || et.type === "Profit Share" || et.type === "Investment"
                        return (
                          <tr key={et.id} className="border-b border-border/40 hover:bg-muted/40">
                            <td className="py-3 px-4 text-foreground">
                              {new Date(et.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 px-4 text-foreground font-bold">{et.partnerName}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPositive 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {et.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium">{et.paymentMethod || "Cash"}</td>
                            <td className={`py-3 px-4 font-extrabold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                              {isPositive ? "+" : "-"}₹{et.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium">{et.notes || "-"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="flex md:hidden flex-col gap-3">
                  {viewFilteredEquityRows.map((et) => {
                    const isPositive = et.type === "Capital Investment" || et.type === "Profit Share" || et.type === "Investment"
                    return (
                      <div key={et.id} className="flex flex-col gap-2.5 p-4 bg-secondary/30 rounded-2xl ring-1 ring-border/40 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(et.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPositive 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}>
                            {et.type}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-border/30 pt-2">
                          <span className="font-extrabold text-foreground text-sm">{et.partnerName}</span>
                          <span className={`font-black text-sm ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? "+" : "-"}₹{et.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {et.notes && (
                          <p className="text-[11px] text-muted-foreground border-t border-border/30 pt-1.5">{et.notes}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

      </div>

      {/* ---------------- RECORD CAPITAL TRANSACTION MODAL ---------------- */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border/80">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Record Capital / Drawing</h3>
              </div>
              <button 
                onClick={() => setIsCapitalModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCapitalTx} className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Select Partner *</label>
                <select
                  value={capPartnerId}
                  onChange={(e) => setCapPartnerId(e.target.value)}
                  required
                  className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.profitSharePercentage}%)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Transaction Type *</label>
                  <select
                    value={capType}
                    onChange={(e) => setCapType(e.target.value as any)}
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Capital Investment">Capital Investment (+)</option>
                    <option value="Drawing (Personal Withdrawal)">Personal Drawing (-)</option>
                    <option value="Profit Share">Profit Share (+)</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={capAmount}
                    onChange={(e) => setCapAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date *</label>
                  <input
                    type="date"
                    required
                    value={capDate}
                    onChange={(e) => setCapDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                  <select
                    value={capMethod}
                    onChange={(e) => setCapMethod(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Remarks / Purpose</label>
                <input
                  type="text"
                  value={capNotes}
                  onChange={(e) => setCapNotes(e.target.value)}
                  placeholder="e.g. Added factory expansion capital"
                  className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3 ring-1 ring-border/30">
                <input
                  type="checkbox"
                  id="syncCashbook"
                  checked={capSyncCashbook}
                  onChange={(e) => setCapSyncCashbook(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <label htmlFor="syncCashbook" className="text-xs font-semibold text-foreground cursor-pointer">
                  Sync with Cashbook (Auto-record factory cash in/out)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-xs font-bold text-secondary-foreground transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADD PARTNER MODAL ---------------- */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border/80">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Add New Factory Partner</h3>
              </div>
              <button 
                onClick={() => setIsPartnerModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPartner} className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Partner Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Rameshbhai"
                  className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Mobile Number</label>
                  <input
                    type="tel"
                    value={newPartnerMobile}
                    onChange={(e) => setNewPartnerMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Profit Share (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPartnerProfitShare}
                    onChange={(e) => setNewPartnerProfitShare(e.target.value)}
                    placeholder="e.g. 50"
                    className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Opening Capital Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newPartnerOpeningBal}
                  onChange={(e) => setNewPartnerOpeningBal(e.target.value)}
                  placeholder="e.g. 100000"
                  className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes / Remarks</label>
                <input
                  type="text"
                  value={newPartnerNotes}
                  onChange={(e) => setNewPartnerNotes(e.target.value)}
                  placeholder="e.g. Managing Partner"
                  className="rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-xs font-bold text-secondary-foreground transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}
