"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Layers, 
  Clock, 
  CheckCircle, 
  Calendar, 
  X, 
  Edit, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  ChevronRight, 
  PlayCircle, 
  CheckCircle2, 
  Flame 
} from "lucide-react"
import { getStoredData, createFabricReceive, updateFabricReceive, type FabricReceive, type FabricHistoryLog, type Seth } from "@/lib/employee-store"

const FABRIC_TYPES = [
  "Denim Cotton",
  "Stretchable Denim",
  "Heavy Denim 14oz",
  "Light Indigo Cotton",
  "Premium Twill",
  "Printed Denim"
]

export default function RollsPage() {
  const [mounted, setMounted] = useState(false)
  const [seths, setSeths] = useState<Seth[]>([])
  const [fabricReceives, setFabricReceives] = useState<FabricReceive[]>([])
  const [fabricHistoryLogs, setFabricHistoryLogs] = useState<FabricHistoryLog[]>([])

  // Search & Filters
  const [searchRoll, setSearchRoll] = useState("")
  const [selectedSethId, setSelectedSethId] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingRollId, setEditingRollId] = useState<string | null>(null)

  // Form Fields
  const [formRollNo, setFormRollNo] = useState("")
  const [formSethId, setFormSethId] = useState("")
  const [formShortNo, setFormShortNo] = useState("")
  const [formFabricType, setFormFabricType] = useState("Denim Cotton")
  const [formMeters, setFormMeters] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const loadData = async () => {
    const data = await getStoredData()
    setSeths(data.seths || [])
    setFabricReceives(data.fabricReceives || [])
    setFabricHistoryLogs(data.fabricHistoryLogs || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    setFormDate(new Date().toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (seths.length > 0 && !formSethId) {
      setFormSethId(seths[0].id)
    }
  }, [seths])

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingRollId(null)
    setFormRollNo(Math.floor(1000000 + Math.random() * 9000000).toString())
    setFormShortNo(`S-${Math.floor(100 + Math.random() * 900)}`)
    setFormMeters("")
    setFormNotes("")
    setFormDate(new Date().toISOString().split("T")[0])
    if (seths.length > 0) {
      setFormSethId(seths[0].id)
    }
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (rec: FabricReceive, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingRollId(rec.id)
    setFormSethId(rec.sethId)
    setFormRollNo(rec.rollNo)
    setFormShortNo(rec.shortNo)
    setFormFabricType(rec.fabricType)
    setFormMeters(rec.receivedQty.toString())
    setFormNotes(rec.notes)
    setFormDate(rec.date)
    setIsDialogOpen(true)
  }

  const handleSaveRoll = async (e: React.FormEvent) => {
    e.preventDefault()
    const metersNum = parseFloat(formMeters)
    if (isNaN(metersNum) || metersNum <= 0 || !formSethId) return

    const selectedSeth = seths.find((s) => s.id === formSethId)
    if (!selectedSeth) return

    if (dialogMode === "add") {
      await createFabricReceive({
        rollNo: formRollNo.trim(),
        shortNo: formShortNo.trim(),
        sethId: formSethId,
        sethName: selectedSeth.name,
        fabricType: formFabricType,
        receivedQty: metersNum,
        date: formDate,
        notes: formNotes.trim() || `New Fabric Roll added manually`
      })
    } else if (dialogMode === "edit" && editingRollId) {
      await updateFabricReceive(editingRollId, {
        sethId: formSethId,
        sethName: selectedSeth.name,
        rollNo: formRollNo.trim(),
        shortNo: formShortNo.trim(),
        fabricType: formFabricType,
        receivedQty: metersNum,
        date: formDate,
        notes: formNotes.trim()
      })
    }

    await loadData()
    setIsDialogOpen(false)
  }

  // Summary Metrics calculations
  const totalRolls = fabricReceives.length
  const activeRolls = fabricReceives.filter((r) => r.status === "Active" || r.status === "Partially Used").length
  const usedRolls = fabricReceives.filter((r) => r.status === "Completed").length
  const remainingFabric = fabricReceives.reduce((sum, r) => sum + (r.remainingQty || 0), 0)

  // Filter list
  const filteredRolls = fabricReceives.filter((rec) => {
    const matchesRoll = (rec.rollNo || "").toLowerCase().includes((searchRoll || "").toLowerCase())
    const matchesSeth = selectedSethId === "All" || rec.sethId === selectedSethId
    const matchesStatus = statusFilter === "All" || rec.status === statusFilter

    return matchesRoll && matchesSeth && matchesStatus
  })

  // Recent Roll Activities (combining logs with actions)
  const recentActivities = fabricHistoryLogs.slice(0, 5)

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Roll Tracking</h1>
              <p className="text-xs text-muted-foreground">Track Fabric Rolls</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Roll</span>
          </button>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Rolls</p>
              <p className="text-lg font-bold text-foreground">{totalRolls}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Active Rolls</p>
              <p className="text-lg font-bold text-foreground">{activeRolls}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Used Rolls</p>
              <p className="text-lg font-bold text-foreground">{usedRolls}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
              <Layers className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Remaining Fabric</p>
              <p className="text-lg font-bold text-foreground">{remainingFabric.toLocaleString("en-IN")}m</p>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Roll Number..."
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              className="w-full rounded-2xl border-0 bg-secondary py-3 pr-4 pl-10 text-sm text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <select
                value={selectedSethId}
                onChange={(e) => setSelectedSethId(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Seths</option>
                {seths.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Partially Used">Partially Used</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </section>

        {/* Roll List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Roll Utilization</h2>
          
          {filteredRolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No fabric rolls found matching criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRolls.map((rec) => {
                const pctUsed = Math.min(100, Math.round((rec.usedQty / rec.receivedQty) * 100))
                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-tight font-black">Roll No: {rec.rollNo}</h3>
                        <p className="mt-1 text-xs text-muted-foreground font-semibold">
                          Seth: <span className="text-foreground">{rec.sethName}</span>
                        </p>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                        rec.status === "Active" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                          : rec.status === "Partially Used"
                          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                          : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                      }`}>
                        {rec.status}
                      </span>
                    </div>

                    {/* Progress Bar Display */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                        <span>Used: {rec.usedQty}m</span>
                        <span>Remaining: {rec.remainingQty}m</span>
                      </div>
                      <div className="relative w-full bg-border rounded-full h-2 overflow-hidden flex shadow-inner">
                        <div 
                          style={{ width: `${pctUsed}%` }} 
                          className="bg-[#ea580c] h-full"
                        />
                        <div 
                          style={{ width: `${100 - pctUsed}%` }} 
                          className="bg-[#16a34a] h-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center text-[10px] font-bold text-muted-foreground">
                      <div className="text-left">
                        <p className="uppercase text-[9px]">Fabric</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{rec.fabricType}</p>
                      </div>
                      <div>
                        <p className="uppercase text-[9px]">Received</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{rec.receivedQty}m</p>
                      </div>
                      <div className="text-right">
                        <p className="uppercase text-[9px]">Consumed</p>
                        <p className="text-xs font-bold text-[#ea580c] mt-0.5">{pctUsed}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                      <Link
                        href={`/rolls/${rec.id}`}
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
                )
              })}
            </div>
          )}
        </section>

        {/* Factory Flow Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Factory Workflow</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                1
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Fabric Receive</p>
              <p className="text-[10px] text-muted-foreground">Cloth rolls arrive from clients (Seths)</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                2
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Roll Created</p>
              <p className="text-[10px] text-muted-foreground">Roll numbers issued & logged automatically</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                3
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Cutting Entry</p>
              <p className="text-[10px] text-muted-foreground">Roll meters consumed to slice jean panels</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                4
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Production</p>
              <p className="text-[10px] text-muted-foreground">Finished pieces counted & delivered to client</p>
            </div>
          </div>
        </section>

        {/* Recent Roll Activities */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Roll Activities</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity logs.</p>
            ) : (
              recentActivities.map((log, idx) => {
                const rec = fabricReceives.find((r) => r.id === log.receiveId)
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-center justify-between pb-3 ${idx < recentActivities.length - 1 ? 'border-b border-border/50' : ''} pt-2.5`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary`}>
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {log.action === "Fabric Received" ? "New Roll Added" : "Roll Consumed"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {rec ? `Roll ${rec.rollNo} (${rec.shortNo})` : "Roll"} — {log.qty}m: {log.remarks}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(log.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>

      {/* Add Roll Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "Register Fabric Roll" : "Edit Roll Details"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveRoll} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8534527"
                    value={formRollNo}
                    onChange={(e) => setFormRollNo(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Select Seth</label>
                  <select
                    value={formSethId}
                    onChange={(e) => setFormSethId(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {seths.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Short Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S-101"
                    value={formShortNo}
                    onChange={(e) => setFormShortNo(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Received Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Fabric Type</label>
                <select
                  value={formFabricType}
                  onChange={(e) => setFormFabricType(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                >
                  {FABRIC_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Received Quantity (Meters)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={formMeters}
                  onChange={(e) => setFormMeters(e.target.value)}
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

              <div className="flex gap-3 mt-3">
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
