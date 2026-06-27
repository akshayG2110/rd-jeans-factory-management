"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Building2, 
  Layers, 
  TrendingUp, 
  ClipboardList, 
  X, 
  Edit, 
  Eye, 
  Calendar, 
  ChevronRight, 
  Phone, 
  MapPin 
} from "lucide-react"
import { getStoredData, createSeth, updateSeth, type Seth, type FabricHistory, type RollTracking, type ProductionHistory, type PaymentHistory } from "@/lib/employee-store"

export default function SethsPage() {
  const [mounted, setMounted] = useState(false)
  const [seths, setSeths] = useState<Seth[]>([])
  const [fabricHistories, setFabricHistories] = useState<FabricHistory[]>([])
  const [rollTrackings, setRollTrackings] = useState<RollTracking[]>([])
  const [productionHistories, setProductionHistories] = useState<ProductionHistory[]>([])
  const [paymentHistories, setPaymentHistories] = useState<PaymentHistory[]>([])

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingSethId, setEditingSethId] = useState<string | null>(null)

  // Form Fields
  const [formName, setFormName] = useState("")
  const [formContact, setFormContact] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formStatus, setFormStatus] = useState<Seth["status"]>("Active")

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setSeths(data.seths)
    setFabricHistories(data.fabricHistories)
    setRollTrackings(data.rollTrackings)
    setProductionHistories(data.productionHistories)
    setPaymentHistories(data.paymentHistories)
  
    };
    loadData();
}, [])

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingSethId(null)
    setFormName("")
    setFormContact("")
    setFormAddress("")
    setFormNotes("")
    setFormStatus("Active")
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (seth: Seth, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingSethId(seth.id)
    setFormName(seth.name)
    setFormContact(seth.contact)
    setFormAddress(seth.address)
    setFormNotes(seth.notes)
    setFormStatus(seth.status)
    setIsDialogOpen(true)
  }

  const handleSaveSeth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    if (dialogMode === "add") {
      const result = await createSeth({
        name: formName.trim(),
        contact: formContact.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        status: "Active"
      })
      if (result) {
        setSeths((prev) => [result, ...prev])
      }
    } else if (dialogMode === "edit" && editingSethId) {
      const result = await updateSeth(editingSethId, {
        name: formName.trim(),
        contact: formContact.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        status: formStatus
      })
      if (result) {
        setSeths((prev) =>
          prev.map((s) => (s.id === editingSethId ? { ...s, ...result } : s))
        )
      }
    }

    setIsDialogOpen(false)
  }

  // Summary Metrics calculations
  const totalSeths = seths.length
  const activeSeths = seths.filter((s) => s.status === "Active").length
  const totalFabric = seths.reduce((acc, curr) => acc + (curr.totalFabric || 0), 0)
  const totalProduction = seths.reduce((acc, curr) => acc + (curr.totalCuttingPieces || 0), 0)

  // Filter list
  const filteredSeths = seths.filter((s) =>
    (s.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  )

  // Recent Activity Items List (combining fabrics, prods, payments)
  const recentActivities: { type: string; title: string; subtitle: string; date: string }[] = []
  
  const fHist = fabricHistories || []
  fHist.slice(0, 3).forEach((f) => {
    const s = seths.find((st) => st.id === f.sethId)
    recentActivities.push({
      type: "fabric",
      title: "Fabric Received",
      subtitle: `${f.meters}m (${f.type}) for ${s ? s.name : "Client"}`,
      date: f.date
    })
  })

  const pHist = productionHistories || []
  pHist.slice(0, 3).forEach((p) => {
    const s = seths.find((st) => st.id === p.sethId)
    recentActivities.push({
      type: "production",
      title: "Cutting Done",
      subtitle: `${p.piecesGenerated} pieces generated (Lot ${p.lotNo}) for ${s ? s.name : "Client"}`,
      date: p.cuttingDate
    })
  })

  const payHist = paymentHistories || []
  payHist.slice(0, 3).forEach((pay) => {
    const s = seths.find((st) => st.id === pay.sethId)
    recentActivities.push({
      type: "payment",
      title: "Payment Received",
      subtitle: `₹${(pay.amount || 0).toLocaleString("en-IN")} received from ${s ? s.name : "Client"}`,
      date: pay.date
    })
  })

  // Sort by date (descending)
  const sortedActivities = recentActivities
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Seth Management</h1>
              <p className="text-xs text-muted-foreground">Manage Factory Clients</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Seth</span>
          </button>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Seths</p>
              <p className="text-lg font-bold text-foreground">{totalSeths}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Active Seths</p>
              <p className="text-lg font-bold text-foreground">{activeSeths}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/10">
              <Layers className="h-4.5 w-4.5 text-[#16a34a]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Fabric Recd</p>
              <p className="text-lg font-bold text-foreground">{totalFabric.toLocaleString("en-IN")}m</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
              <Layers className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Production</p>
              <p className="text-lg font-bold text-foreground">{totalProduction.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Seth Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-0 bg-card py-3.5 pr-4 pl-11 text-sm text-foreground shadow-sm ring-1 ring-border/60 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Seth List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Client Register</h2>
          {filteredSeths.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No clients found matching &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSeths.map((seth) => (
                <div
                  key={seth.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base leading-tight">{seth.name}</h3>
                      {seth.contact && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{seth.contact}</span>
                        </p>
                      )}
                    </div>
                    
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      seth.status === "Active" 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400"
                    }`}>
                      {seth.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                    <div className="text-left">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Fabric Recd</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{(seth.totalFabric || 0).toLocaleString("en-IN")} m</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Rolls</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{seth.totalRolls}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Cutting Pcs</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{(seth.totalCuttingPieces || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                    <Link
                      href={`/seths/${seth.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                    <button
                      onClick={(e) => handleOpenEditDialog(seth, e)}
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

        {/* Recent Activity */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Activity</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {sortedActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity recorded.</p>
            ) : (
              sortedActivities.map((act, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between pb-3 ${idx < sortedActivities.length - 1 ? 'border-b border-border/50' : ''} pt-2.5`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      act.type === 'fabric' ? 'bg-[#16a34a]/10 text-[#16a34a]' : act.type === 'payment' ? 'bg-primary/10 text-primary' : 'bg-[#ea580c]/10 text-[#ea580c]'
                    }`}>
                      {act.type === 'payment' ? <TrendingUp className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{act.title}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{act.date}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Add / Edit Seth Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Add New Seth Client" : "Edit Seth Details"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveSeth} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Seth Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahavir Seth"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Contact Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Cloth Market, Ahmedabad"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Stretch denim fabric rolls client"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {dialogMode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Client Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Seth["status"])}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

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
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground transition-all hover:opacity-95 active:scale-95"
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
