"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Layers, 
  Calendar, 
  Info, 
  TrendingUp, 
  Scissors, 
  ClipboardList, 
  Eye, 
  HelpCircle,
  UserCheck,
  Package
} from "lucide-react"
import { getStoredData, fetchFinishedGoods, type CuttingEntry, type CuttingHistoryLog, type FabricReceive, type FinishedGoodsItem } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function CuttingDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [entry, setEntry] = useState<CuttingEntry | null>(null)
  const [logs, setLogs] = useState<CuttingHistoryLog[]>([])
  const [rolls, setRolls] = useState<FabricReceive[]>([])
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodsItem[]>([])

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      const data = await getStoredData()
      setLogs(data.cuttingHistoryLogs)
      setRolls(data.fabricReceives)

      const cut = data.cuttings.find((c) => c.id === id)
      if (cut) {
        setEntry(cut)
      }

      const goods = await fetchFinishedGoods({ cuttingId: id })
      setFinishedGoods(goods)
    }
    loadData()
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

  if (!entry) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Cutting lot entry not found</p>
          <Link href="/cutting" className="text-sm font-bold text-[#ea580c] hover:underline">
            Back to Cutting Management
          </Link>
        </div>
      </main>
    )
  }

  // Find the roll connected to this cutting lot
  const roll = rolls.find((r) => r.id === entry.rollId || r.rollNo === entry.rollNo)
  const lotLogs = logs.filter((l) => l.cuttingId === id)

  // Calculations for fabric progress bar
  const pctUsed = roll ? Math.min(100, Math.round((roll.usedQty / roll.receivedQty) * 100)) : 0

  // Dynamic pieces distribution based on total lot pieces count
  const basePieces = Math.floor(entry.pieces / 3)
  const sizeDistribution = [
    { size: "Size 28", count: basePieces },
    { size: "Size 30", count: basePieces + (entry.pieces % 3 >= 1 ? 1 : 0) },
    { size: "Size 32", count: basePieces + (entry.pieces % 3 >= 2 ? 1 : 0) }
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/cutting" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Lot Details</h1>
            <p className="text-xs text-muted-foreground">Cutting specifications & fabric roll references</p>
          </div>
        </header>

        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]">
                <Scissors className="h-5.5 w-5.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">Lot Number: {entry.lotNo}</h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </p>
              </div>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              entry.status === "Completed" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                : entry.status === "In Progress"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
            }`}>
              {entry.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Roll Number</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{entry.rollNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Seth Name</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{roll ? roll.sethName : "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cutter / Master</p>
              {entry.employeeId ? (
                <Link
                  href={`/employees/${entry.employeeId}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#ea580c] hover:underline mt-0.5"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{entry.employeeName || "Worker"}</span>
                </Link>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground mt-0.5">Unassigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Production Information */}
        <section className="flex flex-col gap-3.5 rounded-[28px] bg-secondary p-6 ring-1 ring-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Production Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5 bg-card p-4 rounded-2xl shadow-xs text-xs font-semibold text-muted-foreground">
            <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
              <span>Meter Used</span>
              <span className="text-foreground font-extrabold text-sm">{entry.meterUsed} Meters</span>
            </div>
            <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
              <span>Layer Information</span>
              <span className="text-foreground font-extrabold text-sm">{entry.layerInfo}</span>
            </div>
            <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
              <span>Piece Count</span>
              <span className="text-primary font-extrabold text-sm">{entry.pieces} Pieces</span>
            </div>
            <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
              <span>Sizes Selected</span>
              <span className="text-foreground font-extrabold text-sm">{entry.size}</span>
            </div>
            <div className="flex flex-col gap-1 pb-1">
              <span>Pana (Width)</span>
              <span className="text-foreground font-extrabold text-sm">{entry.pana}</span>
            </div>
            <div className="flex flex-col gap-1 pb-1">
              <span>Average per Piece</span>
              <span className="text-foreground font-extrabold text-sm">{entry.average}</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 border-t border-border/40">
              <span>Sort Number</span>
              <span className="text-foreground font-extrabold text-sm">{entry.sortNo}</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 border-t border-border/40">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-[#ea580c]" />
                <span>Assigned Master</span>
              </span>
              <span className="text-foreground font-extrabold text-sm">
                {entry.employeeName ? `${entry.employeeName} (${entry.employeeRole || "Master"})` : "Unassigned"}
              </span>
            </div>
          </div>
        </section>

        {/* Fabric Consumption Card */}
        {roll && (
          <section className="flex flex-col gap-3 rounded-[28px] bg-card p-5 ring-1 ring-border/60 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Fabric Consumption Progress</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                <span>Roll: {roll.rollNo}</span>
                <span>Remaining: {roll.remainingQty}m</span>
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
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-muted-foreground mt-1.5 border-t border-border/50 pt-2.5">
              <div className="text-left">
                <p className="uppercase text-[9px]">Received</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{roll.receivedQty}m</p>
              </div>
              <div>
                <p className="uppercase text-[9px]">Used</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{roll.usedQty}m</p>
              </div>
              <div className="text-right">
                <p className="uppercase text-[9px]">Remaining</p>
                <p className="text-xs font-bold text-[#16a34a] mt-0.5">{roll.remainingQty}m</p>
              </div>
            </div>
          </section>
        )}

        {/* Finished Goods & Garment Inventory Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-[#ea580c]" />
              <span>Finished Goods Garment Batches ({finishedGoods.length})</span>
            </h3>
            <Link 
              href="/inventory"
              className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1"
            >
              <span>Manage in Inventory</span>
              <span>→</span>
            </Link>
          </div>

          {finishedGoods.length === 0 ? (
            <div className="flex flex-col gap-2 bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-sm text-center py-6">
              <p className="text-xs text-muted-foreground font-semibold">No finished goods SKU batches logged for this lot yet.</p>
              <Link 
                href="/inventory"
                className="text-xs font-bold text-[#ea580c] hover:underline"
              >
                + Initialize Garment SKU in Inventory
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {finishedGoods.map((fg) => (
                <div 
                  key={fg.id} 
                  className="flex flex-col gap-2.5 bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-foreground">{fg.itemName} · Size {fg.size}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Shade: {fg.colorShade}</p>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      fg.status === "Ready" || fg.status === "Dispatched"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                        : fg.status === "In Stitching"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                        : "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                    }`}>
                      {fg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t border-border/40 pt-2 text-center text-[10px] font-bold">
                    <div className="text-left">
                      <p className="text-muted-foreground uppercase text-[8px]">Total Cut</p>
                      <p className="text-xs font-extrabold text-foreground">{fg.totalPieces}p</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase text-[8px]">Stitching</p>
                      <p className="text-xs font-extrabold text-blue-600">{fg.stitchingPieces}p</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase text-[8px]">Ready</p>
                      <p className="text-xs font-extrabold text-emerald-600">{fg.finishedPieces}p</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground uppercase text-[8px]">Dispatched</p>
                      <p className="text-xs font-extrabold text-purple-600">{fg.dispatchedPieces}p</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Connected Roll Information Card */}
        {roll && (
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-foreground px-1">Connected Roll Information</h3>
            <div className="flex items-center justify-between bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Roll Number: {roll.rollNo}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    Fabric: {roll.fabricType} | Remaining: {roll.remainingQty}m
                  </p>
                </div>
              </div>

              <Link
                href={`/rolls/${roll.id}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary hover:bg-muted text-foreground transition-all active:scale-90"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Production Timeline */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1">Production Timeline</h3>
          
          {lotLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No timeline events recorded.</p>
            </div>
          ) : (
            <div className="relative border-l border-border/70 ml-4 pl-6 flex flex-col gap-5 py-2">
              {lotLogs.map((log) => (
                <div key={log.id} className="relative">
                  <span className={`absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-background bg-secondary`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                  </span>
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">{log.event}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{log.remarks}</p>
                      </div>
                      <p className="text-sm font-extrabold text-foreground shrink-0">
                        {log.event === "Cutting Started" ? `${log.qty}m` : `${log.qty} Pcs`}
                      </p>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </p>
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
