"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Scissors, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  X, 
  Edit, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle 
} from "lucide-react"
import { getStoredData, createCutting, updateCutting, getRecentMonthsOptions, type CuttingEntry, type CuttingHistoryLog, type FabricReceive } from "@/lib/employee-store"

export default function CuttingPage() {
  const [mounted, setMounted] = useState(false)
  const [cuttings, setCuttings] = useState<CuttingEntry[]>([])
  const [cuttingLogs, setCuttingLogs] = useState<CuttingHistoryLog[]>([])
  const [fabricReceives, setFabricReceives] = useState<FabricReceive[]>([])

  // Search & Filters
  const [searchLot, setSearchLot] = useState("")
  const [searchRoll, setSearchRoll] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("All")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  // Form Fields
  const [formDate, setFormDate] = useState("")
  const [formLotNo, setFormLotNo] = useState("")
  const [formRollId, setFormRollId] = useState("")
  const [formMeterUsed, setFormMeterUsed] = useState("")
  const [formPieces, setFormPieces] = useState("")
  const [formSize, setFormSize] = useState("28+36")
  const [formLayers, setFormLayers] = useState("50 Layers")
  const [formPana, setFormPana] = useState("58 Inch")
  const [formAverage, setFormAverage] = useState("0.80 Meter")
  const [formSortNo, setFormSortNo] = useState("S-101")
  const [formStatus, setFormStatus] = useState<CuttingEntry["status"]>("In Progress")
  const [formNotes, setFormNotes] = useState("")

  const loadData = async () => {
    const data = await getStoredData()
    setCuttings(data.cuttings || [])
    setCuttingLogs(data.cuttingHistoryLogs || [])
    setFabricReceives(data.fabricReceives || [])
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    setFormDate(new Date().toISOString().split("T")[0])
    setFormLotNo(Math.floor(200 + Math.random() * 800).toString())
  }, [])

  useEffect(() => {
    if (fabricReceives.length > 0 && !formRollId) {
      setFormRollId(fabricReceives[0].id)
    }
  }, [fabricReceives])

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setEditingEntryId(null)
    setFormLotNo(Math.floor(200 + Math.random() * 800).toString())
    setFormMeterUsed("")
    setFormPieces("")
    setFormNotes("")
    setFormStatus("In Progress")
    setFormDate(new Date().toISOString().split("T")[0])
    if (fabricReceives.length > 0) {
      setFormRollId(fabricReceives[0].id)
    }
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (entry: CuttingEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDialogMode("edit")
    setEditingEntryId(entry.id)
    setFormLotNo(entry.lotNo)
    setFormRollId(entry.rollId)
    setFormMeterUsed(entry.meterUsed.toString())
    setFormPieces(entry.pieces.toString())
    setFormSize(entry.size)
    setFormLayers(entry.layerInfo)
    setFormPana(entry.pana)
    setFormAverage(entry.average)
    setFormSortNo(entry.sortNo)
    setFormStatus(entry.status)
    setFormNotes(entry.notes)
    setFormDate(entry.date)
    setIsDialogOpen(true)
  }

  const handleSaveCutting = async (e: React.FormEvent) => {
    e.preventDefault()
    const metersUsedNum = parseFloat(formMeterUsed)
    const piecesNum = parseInt(formPieces)

    if (isNaN(metersUsedNum) || isNaN(piecesNum) || metersUsedNum <= 0 || piecesNum <= 0 || !formRollId) return

    const selectedRoll = fabricReceives.find((r) => r.id === formRollId)
    if (!selectedRoll) return

    if (dialogMode === "add") {
      await createCutting({
        lotNo: formLotNo.trim(),
        date: formDate,
        rollId: formRollId,
        rollNo: selectedRoll.rollNo,
        meterUsed: metersUsedNum,
        pieces: piecesNum,
        size: formSize,
        layerInfo: formLayers,
        pana: formPana,
        average: formAverage,
        sortNo: formSortNo,
        notes: formNotes.trim() || `Lot ${formLotNo} cutting entry`
      })
    } else if (dialogMode === "edit" && editingEntryId) {
      await updateCutting(editingEntryId, {
        lotNo: formLotNo.trim(),
        rollId: formRollId,
        rollNo: selectedRoll.rollNo,
        meterUsed: metersUsedNum,
        pieces: piecesNum,
        size: formSize,
        layerInfo: formLayers,
        pana: formPana,
        average: formAverage,
        sortNo: formSortNo,
        notes: formNotes.trim(),
        date: formDate
      })
    }

    await loadData()
    setIsDialogOpen(false)
  }

  // Summary calculations
  const totalLots = cuttings.length
  const totalPieces = cuttings.reduce((sum, c) => sum + c.pieces, 0)
  const totalMeters = cuttings.reduce((sum, c) => sum + c.meterUsed, 0)
  
  // Today's pieces
  const todayDateStr = new Date().toISOString().split("T")[0]
  const todaysCutting = cuttings
    .filter((c) => c.date === todayDateStr)
    .reduce((sum, c) => sum + c.pieces, 0)

  // Filter list
  const filteredCuttings = cuttings.filter((cut) => {
    const matchesLot = (cut.lotNo || "").toLowerCase().includes((searchLot || "").toLowerCase())
    const matchesRoll = (cut.rollNo || "").toLowerCase().includes((searchRoll || "").toLowerCase())
    
    let matchesMonth = true
    if (selectedMonth !== "All") {
      matchesMonth = (cut.date || "").includes(`-0${selectedMonth}`) || (cut.date || "").includes(`-${selectedMonth}`)
    }

    return matchesLot && matchesRoll && matchesMonth
  })

  // Recent Activity Items List (combining events)
  const recentActivities = cuttingLogs.slice(0, 5)

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Cutting Management</h1>
              <p className="text-xs text-muted-foreground">Manage Cutting Production</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-1.5 rounded-full bg-[#ea580c] px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Entry</span>
          </button>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
              <Scissors className="h-4.5 w-4.5 text-[#ea580c]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Lots</p>
              <p className="text-lg font-bold text-foreground">{totalLots}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Pieces</p>
              <p className="text-lg font-bold text-foreground">{totalPieces.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/10">
              <Layers className="h-4.5 w-4.5 text-[#16a34a]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Meter Consumed</p>
              <p className="text-lg font-bold text-foreground">{totalMeters.toLocaleString("en-IN")}m</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Today's Cutting</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{todaysCutting}</p>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lot Number..."
                value={searchLot}
                onChange={(e) => setSearchLot(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary py-2.5 pr-2 pl-9 text-xs text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Roll Number..."
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value)}
                className="w-full rounded-xl border-0 bg-secondary py-2.5 pr-2 pl-9 text-xs text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
            >
              <option value="All">All Months</option>
              {getRecentMonthsOptions(6).map((opt) => (
                <option key={opt.key} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Cutting List */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Cutting Lots</h2>
          {filteredCuttings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <p className="text-sm text-muted-foreground">No cutting lot entries found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCuttings.map((cut) => (
                <div
                  key={cut.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">Lot No: {cut.lotNo}</h3>
                      <p className="mt-1 text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(cut.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </p>
                    </div>

                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      cut.status === "Completed" 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                        : cut.status === "In Progress"
                        ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                    }`}>
                      {cut.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t border-border/50 pt-3 text-center text-[10px] font-bold text-muted-foreground">
                    <div className="text-left">
                      <p className="uppercase text-[9px]">Roll</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{cut.rollNo}</p>
                    </div>
                    <div>
                      <p className="uppercase text-[9px]">Meters</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{cut.meterUsed}m</p>
                    </div>
                    <div>
                      <p className="uppercase text-[9px]">Pieces</p>
                      <p className="text-xs font-bold text-primary mt-0.5">{cut.pieces}</p>
                    </div>
                    <div className="text-right">
                      <p className="uppercase text-[9px]">Size</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{cut.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                    <Link
                      href={`/cutting/${cut.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-all active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={(e) => handleOpenEditDialog(cut, e)}
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

        {/* Production Flow Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Production Flow</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#ea580c] font-bold text-xs">
                1
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Fabric Receive</p>
              <p className="text-[10px] text-muted-foreground">Incoming fabric logs from seths</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#ea580c] font-bold text-xs">
                2
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Roll Created</p>
              <p className="text-[10px] text-muted-foreground">Unique roll code & length tracked</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#ea580c] font-bold text-xs">
                3
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Cutting Lot</p>
              <p className="text-[10px] text-muted-foreground">Roll layered and sliced into sections</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[#ea580c] font-bold text-xs">
                4
              </span>
              <p className="text-[11px] font-bold text-foreground leading-tight">Pieces Generated</p>
              <p className="text-[10px] text-muted-foreground">Jeans parts bundled for stitching worker</p>
            </div>
          </div>
        </section>

        {/* Recent Production Activity */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground px-1">Recent Production Activity</h2>
          <div className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent cutting activity logs.</p>
            ) : (
              recentActivities.map((log, idx) => (
                <div 
                  key={log.id} 
                  className={`flex items-center justify-between pb-3 ${idx < recentActivities.length - 1 ? 'border-b border-border/50' : ''} pt-2.5`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]`}>
                      <Scissors className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {log.event === "Cutting Started" ? "New Lot Created" : "Pieces Generated"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {log.remarks}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(log.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Add Cutting Entry Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 duration-200 rounded-[28px] bg-card p-6 shadow-xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {dialogMode === "add" ? "New Cutting Entry" : "Edit Cutting Lot"}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveCutting} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Cutting Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Lot Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 281"
                    value={formLotNo}
                    onChange={(e) => setFormLotNo(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Select Roll</label>
                  <select
                    value={formRollId}
                    onChange={(e) => setFormRollId(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  >
                    {fabricReceives.filter(r => r.remainingQty > 0).map((r) => (
                      <option key={r.id} value={r.id}>Roll: {r.rollNo} ({r.remainingQty}m left)</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Meter Used</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150"
                    value={formMeterUsed}
                    onChange={(e) => setFormMeterUsed(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Layer Information</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 Layers"
                    value={formLayers}
                    onChange={(e) => setFormLayers(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Piece Count</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 190"
                    value={formPieces}
                    onChange={(e) => setFormPieces(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28+36"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Pana (Width)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 58 Inch"
                    value={formPana}
                    onChange={(e) => setFormPana(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Average per Piece</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0.80 Meter"
                    value={formAverage}
                    onChange={(e) => setFormAverage(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Sort Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S-101"
                    value={formSortNo}
                    onChange={(e) => setFormSortNo(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Status Badge</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as CuttingEntry["status"])}
                  className="rounded-xl border-0 bg-secondary px-4 py-3 text-sm text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Denim pieces cut cleanly"
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
