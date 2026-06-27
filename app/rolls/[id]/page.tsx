"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Layers, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Info, 
  TrendingUp, 
  Scissors, 
  ChevronRight, 
  ClipboardList 
} from "lucide-react"
import { getStoredData, type FabricReceive, type FabricHistoryLog, type ProductionHistory } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function RollDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [receive, setReceive] = useState<FabricReceive | null>(null)
  const [logs, setLogs] = useState<FabricHistoryLog[]>([])
  const [productionHistories, setProductionHistories] = useState<ProductionHistory[]>([])

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setLogs(data.fabricHistoryLogs)
    setProductionHistories(data.productionHistories)

    const rec = data.fabricReceives.find((r) => r.id === id)
    if (rec) {
      setReceive(rec)
    }
  
    };
    loadData();
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

  if (!receive) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Roll tracking record not found</p>
          <Link href="/rolls" className="text-sm font-bold text-primary hover:underline">
            Back to Roll Tracking
          </Link>
        </div>
      </main>
    )
  }

  // Filter logs for this roll
  const rollLogs = logs.filter((log) => log.receiveId === id)

  // Connected cutting lots (mocked from production histories matching sethId and lot info, or matching logs remarks)
  // Let's filter logs that have lot info and map them to production lots
  const connectedLots = productionHistories.filter((prod) => prod.sethId === receive.sethId)

  // Calculations
  const pctUsed = Math.min(100, Math.round((receive.usedQty / receive.receivedQty) * 100))
  const pctRemaining = 100 - pctUsed

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/rolls" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Roll Specs</h1>
            <p className="text-xs text-muted-foreground">Roll details & cutting lot metrics</p>
          </div>
        </header>

        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Layers className="h-5.5 w-5.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">Roll No: {receive.rollNo}</h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Short No: {receive.shortNo}</p>
              </div>
            </div>
            
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              receive.status === "Active" 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                : receive.status === "Partially Used"
                ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
            }`}>
              {receive.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Seth Client</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{receive.sethName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fabric Type</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{receive.fabricType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Received Date</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {new Date(receive.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Roll Summary Card */}
        <div className="grid grid-cols-3 gap-3 rounded-[24px] bg-secondary p-4 ring-1 ring-border/50 text-center font-bold text-muted-foreground">
          <div className="text-left bg-card p-3 rounded-2xl shadow-xs">
            <p className="text-[9px] uppercase">Received</p>
            <p className="text-sm font-black text-foreground mt-1">{receive.receivedQty}m</p>
          </div>
          <div className="bg-card p-3 rounded-2xl shadow-xs">
            <p className="text-[9px] uppercase text-[#ea580c]">Used</p>
            <p className="text-sm font-black text-[#ea580c] mt-1">{receive.usedQty}m</p>
          </div>
          <div className="text-right bg-card p-3 rounded-2xl shadow-xs">
            <p className="text-[9px] uppercase text-[#16a34a]">Remaining</p>
            <p className="text-sm font-black text-[#16a34a] mt-1">{receive.remainingQty}m</p>
          </div>
        </div>

        {/* Visual Progress Section */}
        <section className="flex flex-col gap-3.5 rounded-[28px] bg-card p-6 ring-1 ring-border/60 shadow-lg">
          <div className="flex items-center justify-between font-bold">
            <h3 className="text-sm text-foreground flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-primary" />
              <span>Roll Utilization Progress</span>
            </h3>
            <span className="text-xs text-[#ea580c]">{pctUsed}% Consumed</span>
          </div>

          <div className="relative w-full bg-border rounded-full h-3 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${pctUsed}%` }} 
              className="bg-[#ea580c] h-full"
            />
            <div 
              style={{ width: `${pctRemaining}%` }} 
              className="bg-[#16a34a] h-full"
            />
          </div>
        </section>

        {/* Consumption History Timeline */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1">Consumption History</h3>
          
          {rollLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No cutting log events recorded.</p>
            </div>
          ) : (
            <div className="relative border-l border-border/70 ml-4 pl-6 flex flex-col gap-5 py-2">
              {rollLogs.map((log) => (
                <div key={log.id} className="relative">
                  <span className={`absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-background bg-secondary`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                  </span>
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">{log.action}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{log.remarks}</p>
                      </div>
                      <p className="text-sm font-extrabold text-[#ea580c] shrink-0">{log.qty} Meters</p>
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

        {/* Connected Cutting Lots */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1">Connected Cutting Lots</h3>

          {connectedLots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No cutting lots connected for this client.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {connectedLots.map((lot) => (
                <div key={lot.id} className="flex justify-between items-center bg-card p-4 rounded-3xl ring-1 ring-border/60 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]">
                      <Scissors className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Lot Number: {lot.lotNo}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        Meters Used: {lot.metersUsed}m | Pieces: {lot.piecesGenerated.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => alert(`Navigating to details of Lot ${lot.lotNo}`)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-all active:scale-90"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
