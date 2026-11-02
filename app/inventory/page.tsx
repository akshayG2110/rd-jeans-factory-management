"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Package, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  X, 
  Edit, 
  TrendingUp, 
  Truck, 
  Scissors,
  AlertTriangle,
  Building2,
  Filter,
  Check
} from "lucide-react"
import { 
  fetchFinishedGoods, 
  createFinishedGoodsItem, 
  updateFinishedGoodsItem, 
  fetchFinishedGoodsSummary,
  getStoredData, 
  type FinishedGoodsItem, 
  type CuttingEntry,
  type Seth
} from "@/lib/employee-store"

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<FinishedGoodsItem[]>([])
  const [cuttings, setCuttings] = useState<CuttingEntry[]>([])
  const [seths, setSeths] = useState<Seth[]>([])
  const [summary, setSummary] = useState({
    totalCut: 0,
    totalInStitching: 0,
    totalReady: 0,
    totalDispatched: 0,
    totalRejected: 0,
    totalBatches: 0
  })

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sethFilter, setSethFilter] = useState("All")

  // Stage Update Modal
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FinishedGoodsItem | null>(null)
  const [modalStatus, setModalStatus] = useState<FinishedGoodsItem["status"]>("Cut")
  const [modalStitching, setModalStitching] = useState("")
  const [modalFinished, setModalFinished] = useState("")
  const [modalRejected, setModalRejected] = useState("")
  const [modalDispatched, setModalDispatched] = useState("")
  const [modalDispatchDate, setModalDispatchDate] = useState("")
  const [modalNotes, setModalNotes] = useState("")

  // Add SKU Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newCuttingId, setNewCuttingId] = useState("")
  const [newItemName, setNewItemName] = useState("Denim Jeans")
  const [newSize, setNewSize] = useState("32")
  const [newColorShade, setNewColorShade] = useState("Dark Indigo")
  const [newPieces, setNewPieces] = useState("")
  const [newUnitPrice, setNewUnitPrice] = useState("")
  const [newNotes, setNewNotes] = useState("")

  const loadData = async () => {
    const data = await getStoredData()
    setCuttings(data.cuttings || [])
    setSeths(data.seths || [])

    const goods = await fetchFinishedGoods()
    setItems(goods)

    const sum = await fetchFinishedGoodsSummary()
    setSummary(sum)
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const handleOpenStageModal = (item: FinishedGoodsItem) => {
    setSelectedItem(item)
    setModalStatus(item.status)
    setModalStitching(item.stitchingPieces.toString())
    setModalFinished(item.finishedPieces.toString())
    setModalRejected(item.rejectedPieces.toString())
    setModalDispatched(item.dispatchedPieces.toString())
    setModalDispatchDate(item.dispatchDate || new Date().toISOString().split("T")[0])
    setModalNotes(item.notes || "")
    setStageModalOpen(true)
  }

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const stitching = parseInt(modalStitching) || 0
    const finished = parseInt(modalFinished) || 0
    const rejected = parseInt(modalRejected) || 0
    const dispatched = parseInt(modalDispatched) || 0

    await updateFinishedGoodsItem(selectedItem.id, {
      status: modalStatus,
      stitchingPieces: stitching,
      finishedPieces: finished,
      rejectedPieces: rejected,
      dispatchedPieces: dispatched,
      dispatchDate: modalStatus === "Dispatched" ? modalDispatchDate : undefined,
      notes: modalNotes.trim()
    })

    setStageModalOpen(false)
    await loadData()
  }

  const handleOpenAddModal = () => {
    if (cuttings.length > 0) {
      setNewCuttingId(cuttings[0].id)
    }
    setNewItemName("Denim Jeans")
    setNewSize("32")
    setNewColorShade("Dark Indigo")
    setNewPieces("100")
    setNewUnitPrice("")
    setNewNotes("")
    setAddModalOpen(true)
  }

  const handleSaveNewSKU = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCuttingId || !newPieces) return

    const selectedCut = cuttings.find(c => c.id === newCuttingId)
    if (!selectedCut) return

    await createFinishedGoodsItem({
      cuttingId: newCuttingId,
      lotNumber: selectedCut.lotNo,
      itemName: newItemName.trim() || "Denim Jeans",
      size: newSize.trim(),
      colorShade: newColorShade.trim() || "Dark Indigo",
      totalPieces: parseInt(newPieces, 10),
      finishedPieces: parseInt(newPieces, 10),
      status: "Cut",
      unitPrice: newUnitPrice ? parseFloat(newUnitPrice) : 0,
      notes: newNotes.trim()
    })

    setAddModalOpen(false)
    await loadData()
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      (item.lotNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sethName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.size || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.colorShade || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || item.status === statusFilter
    const matchesSeth = sethFilter === "All" || item.sethId === sethFilter

    return matchesSearch && matchesStatus && matchesSeth
  })

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
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-28">

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Finished Goods Inventory</h1>
              <p className="text-xs text-muted-foreground">Cut piece lifecycle & garment dispatch tracking</p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-2xl bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add SKU</span>
          </button>
        </header>

        {/* KPI Metrics Summary */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#ea580c]">
              <Scissors className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Cut in Pipeline</p>
              <p className="text-lg font-bold text-foreground">{summary.totalCut.toLocaleString("en-IN")} pcs</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Layers className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">In Stitching</p>
              <p className="text-lg font-bold text-blue-600">{summary.totalInStitching.toLocaleString("en-IN")} pcs</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Ready / Finished</p>
              <p className="text-lg font-bold text-emerald-600">{summary.totalReady.toLocaleString("en-IN")} pcs</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Dispatched</p>
              <p className="text-lg font-bold text-purple-600">{summary.totalDispatched.toLocaleString("en-IN")} pcs</p>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by lot number, item name, client, size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-0 bg-secondary py-2.5 pr-3 pl-9 text-xs text-foreground ring-1 ring-border/20 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
            >
              <option value="All">All Production Stages</option>
              <option value="Cut">Cut (Ready for Stitching)</option>
              <option value="In Stitching">In Stitching</option>
              <option value="Washing">Washing / Finishing</option>
              <option value="Ready">Ready for Delivery</option>
              <option value="Dispatched">Dispatched to Client</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={sethFilter}
              onChange={(e) => setSethFilter(e.target.value)}
              className="w-full rounded-xl border-0 bg-secondary px-3 py-2 text-xs text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
            >
              <option value="All">All Seths (Clients)</option>
              {seths.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Garment Inventory List */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-foreground">Garment Inventory Lots ({filteredItems.length})</h2>
            <span className="text-xs text-muted-foreground font-semibold">
              {filteredItems.reduce((sum, i) => sum + i.totalPieces, 0).toLocaleString("en-IN")} pcs total
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-12 px-4 text-center ring-1 ring-border/60 shadow-sm">
              <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">No garment inventory entries found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a cutting lot or add a new garment SKU batch.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredItems.map((item) => {
                const pctReady = item.totalPieces > 0 ? Math.round(((item.finishedPieces + item.dispatchedPieces) / item.totalPieces) * 100) : 0

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3.5 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm leading-tight">Lot #{item.lotNumber}</h3>
                          <span className="text-xs font-semibold text-muted-foreground">· {item.itemName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-primary/70"></span>
                          <span>Size: <strong className="text-foreground">{item.size}</strong></span>
                          <span>· Shade: <strong className="text-foreground">{item.colorShade}</strong></span>
                        </p>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        item.status === "Ready" || item.status === "Dispatched"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : item.status === "In Stitching"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          : item.status === "Washing"
                          ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                          : "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                        <span>Production Progress</span>
                        <span>{pctReady}% completed</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden flex">
                        <div style={{ width: `${pctReady}%` }} className="bg-[#ea580c] h-full transition-all"></div>
                      </div>
                    </div>

                    {/* Quantities Grid */}
                    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-secondary p-3 text-center text-[10px] font-bold">
                      <div className="text-left">
                        <p className="text-muted-foreground uppercase text-[9px]">Total Cut</p>
                        <p className="text-xs font-extrabold text-foreground mt-0.5">{item.totalPieces} pcs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px]">Stitching</p>
                        <p className="text-xs font-extrabold text-blue-600 mt-0.5">{item.stitchingPieces} pcs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px]">Ready</p>
                        <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{item.finishedPieces} pcs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground uppercase text-[9px]">Dispatched</p>
                        <p className="text-xs font-extrabold text-purple-600 mt-0.5">{item.dispatchedPieces} pcs</p>
                      </div>
                    </div>

                    {item.rejectedPieces > 0 && (
                      <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{item.rejectedPieces} rejected/damaged pieces logged</span>
                      </p>
                    )}

                    {/* Client & Cutter Info */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        <span>Client: <strong className="text-foreground">{item.sethName || "N/A"}</strong></span>
                      </div>
                      {item.cutterName && (
                        <span>Cutter: <strong className="text-foreground">{item.cutterName}</strong></span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                      <button
                        onClick={() => handleOpenStageModal(item)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#ea580c] hover:bg-[#ea580c]/90 text-white py-2.5 text-xs font-bold transition-all active:scale-95"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Update Stage</span>
                      </button>
                      <Link
                        href={`/cutting/${item.cuttingId}`}
                        className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary hover:bg-muted text-foreground py-2.5 px-4 text-xs font-bold ring-1 ring-border/60 transition-all active:scale-95"
                      >
                        <span>View Cutting Lot</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>

      {/* STAGE PROGRESSION MODAL */}
      {stageModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border/80 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Update Production Stage</h3>
                <p className="text-xs text-muted-foreground">Lot #{selectedItem.lotNumber} · {selectedItem.itemName}</p>
              </div>
              <button 
                onClick={() => setStageModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Current Stage Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as FinishedGoodsItem["status"])}
                  className="rounded-xl border-0 bg-secondary px-4 py-2.5 text-xs text-foreground ring-1 ring-border/20 font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Cut">Cut (Awaiting Stitching)</option>
                  <option value="In Stitching">In Stitching (On Sewing Floor)</option>
                  <option value="Washing">Washing / Finishing Plant</option>
                  <option value="Ready">Ready (Ironed, Checked & Packed)</option>
                  <option value="Dispatched">Dispatched to Seth</option>
                  <option value="Closed">Closed / Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">In Stitching Pieces</label>
                  <input
                    type="number"
                    value={modalStitching}
                    onChange={(e) => setModalStitching(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Ready / Finished Pieces</label>
                  <input
                    type="number"
                    value={modalFinished}
                    onChange={(e) => setModalFinished(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Rejected / Damaged</label>
                  <input
                    type="number"
                    value={modalRejected}
                    onChange={(e) => setModalRejected(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none text-red-600 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Dispatched Pieces</label>
                  <input
                    type="number"
                    value={modalDispatched}
                    onChange={(e) => setModalDispatched(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none text-purple-600 font-bold"
                  />
                </div>
              </div>

              {modalStatus === "Dispatched" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Dispatch / Delivery Date</label>
                  <input
                    type="date"
                    value={modalDispatchDate}
                    onChange={(e) => setModalDispatchDate(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Stage Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Delivered 80 pcs via auto challan"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStageModalOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary py-2.5 text-xs font-bold text-secondary-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#ea580c] py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  Save Progression
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SKU / BATCH MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border/80 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-bold text-foreground">Add Garment Inventory SKU</h3>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSKU} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Select Source Cutting Lot</label>
                <select
                  value={newCuttingId}
                  onChange={(e) => setNewCuttingId(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-3 py-2.5 text-xs text-foreground ring-1 ring-border/20 font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {cuttings.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lot #{c.lotNo} ({c.pieces} pcs cut, Roll {c.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Slim Fit Denim"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 32"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Color / Shade</label>
                  <input
                    type="text"
                    placeholder="e.g. Dark Indigo"
                    value={newColorShade}
                    onChange={(e) => setNewColorShade(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Allocated Pieces</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={newPieces}
                    onChange={(e) => setNewPieces(e.target.value)}
                    className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Job-Work Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional rate per piece"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Size 32 batch ready for stitching line 2"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="rounded-xl border-0 bg-secondary px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border/20 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary py-2.5 text-xs font-bold text-secondary-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#ea580c] py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  Create Garment SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
