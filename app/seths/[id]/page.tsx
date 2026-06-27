"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Layers, 
  Wallet, 
  Calendar, 
  PlusCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Phone, 
  Calculator 
} from "lucide-react"
import { 
  getStoredData, 
  type Seth, 
  type FabricHistory, 
  type RollTracking, 
  type ProductionHistory, 
  type PaymentHistory 
} from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function SethDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [seth, setSeth] = useState<Seth | null>(null)
  const [fabricHistories, setFabricHistories] = useState<FabricHistory[]>([])
  const [rollTrackings, setRollTrackings] = useState<RollTracking[]>([])
  const [productionHistories, setProductionHistories] = useState<ProductionHistory[]>([])
  const [paymentHistories, setPaymentHistories] = useState<PaymentHistory[]>([])

  // Tab State
  const [activeTab, setActiveTab] = useState<"fabric" | "rolls" | "production" | "payments">("fabric")

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setFabricHistories(data.fabricHistories)
    setRollTrackings(data.rollTrackings)
    setProductionHistories(data.productionHistories)
    setPaymentHistories(data.paymentHistories)

    const client = data.seths.find((s) => s.id === id)
    if (client) {
      setSeth(client)
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

  if (!seth) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Seth client record not found</p>
          <Link href="/seths" className="text-sm font-bold text-primary hover:underline">
            Back to Seth Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter histories for this Seth
  const clientFabric = fabricHistories.filter((f) => f.sethId === id)
  const clientRolls = rollTrackings.filter((r) => r.sethId === id)
  const clientProduction = productionHistories.filter((p) => p.sethId === id)
  const clientPayments = paymentHistories.filter((pay) => pay.sethId === id)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/seths" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Seth Details</h1>
            <p className="text-xs text-muted-foreground">Client profile and history logs</p>
          </div>
        </header>

        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{seth.name}</h2>
              <div className="flex flex-col gap-1.5 mt-2">
                {seth.contact && (
                  <p className="text-xs text-primary-foreground/85 font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{seth.contact}</span>
                  </p>
                )}
                {seth.address && (
                  <p className="text-xs text-primary-foreground/85 font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{seth.address}</span>
                  </p>
                )}
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              {seth.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Fabric Received</p>
              <p className="text-base font-bold mt-0.5">{seth.totalFabric.toLocaleString("en-IN")} m</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Total Rolls</p>
              <p className="text-base font-bold mt-0.5">{seth.totalRolls} rolls</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-4 mt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Total Cutting Lots</p>
              <p className="text-base font-bold mt-0.5">{seth.totalCuttingLots} lots</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Total Cutting Pieces</p>
              <p className="text-base font-bold mt-0.5">{seth.totalCuttingPieces.toLocaleString("en-IN")} pcs</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/80 pb-0.5 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["fabric", "rolls", "production", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-xs font-extrabold capitalize border-b-2 transition-all whitespace-nowrap active:scale-95 ${
                activeTab === tab 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "fabric" ? "Fabric History" : tab === "rolls" ? "Roll Tracking" : tab === "production" ? "Production History" : "Payment History"}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <section className="flex flex-col gap-4">
          
          {/* Section 1: Fabric History */}
          {activeTab === "fabric" && (
            <div className="flex flex-col gap-3">
              {clientFabric.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-8 px-4 text-center ring-1 ring-border/60 shadow-xs">
                  <p className="text-xs text-muted-foreground">No fabric logs recorded.</p>
                </div>
              ) : (
                clientFabric.map((fab) => (
                  <div key={fab.id} className="flex justify-between items-center bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                        <Layers className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{fab.type}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Roll No: {fab.rollNo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{fab.meters} Meters</p>
                      <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5 justify-end">
                        <Calendar className="h-3 w-3" />
                        <span>{fab.date}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section 2: Roll Tracking */}
          {activeTab === "rolls" && (
            <div className="flex flex-col gap-3">
              {clientRolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-8 px-4 text-center ring-1 ring-border/60 shadow-xs">
                  <p className="text-xs text-muted-foreground">No roll tracking logs found.</p>
                </div>
              ) : (
                clientRolls.map((roll) => (
                  <div key={roll.id} className="flex flex-col gap-3 bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-foreground">Roll: {roll.rollNo}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        roll.status === "Full" 
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" 
                          : roll.status === "Partial"
                          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {roll.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center border-t border-border/50 pt-2 text-[11px] font-semibold text-muted-foreground">
                      <div className="text-left">
                        <p className="text-[9px] uppercase font-bold">Received</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{roll.receivedQty}m</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold">Used</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{roll.usedQty}m</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-bold">Remaining</p>
                        <p className="text-xs font-bold text-primary mt-0.5">{roll.remainingQty}m</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section 3: Production History */}
          {activeTab === "production" && (
            <div className="flex flex-col gap-3">
              {clientProduction.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-8 px-4 text-center ring-1 ring-border/60 shadow-xs">
                  <p className="text-xs text-muted-foreground">No production history logs.</p>
                </div>
              ) : (
                clientProduction.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ea580c]/10 text-[#ea580c]">
                        <Layers className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">Lot: {prod.lotNo}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Used: {prod.metersUsed}m fabric</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{prod.piecesGenerated.toLocaleString("en-IN")} Pcs</p>
                      <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5 justify-end">
                        <Calendar className="h-3 w-3" />
                        <span>{prod.cuttingDate}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section 4: Payment History */}
          {activeTab === "payments" && (
            <div className="flex flex-col gap-3">
              {clientPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-8 px-4 text-center ring-1 ring-border/60 shadow-xs">
                  <p className="text-xs text-muted-foreground">No payment history recorded.</p>
                </div>
              ) : (
                clientPayments.map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">₹{pay.amount.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{pay.remarks}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{pay.date}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

        </section>

      </div>
    </main>
  )
}
