"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info, 
  Briefcase, 
  Calculator, 
  Scale 
} from "lucide-react"
import { getStoredData, type PartnerAccount, type PartnerTransaction } from "@/lib/employee-store"

interface Props {
  params: Promise<{ id: string }>
}

export default function PartnerDetailsPage({ params }: Props) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [mounted, setMounted] = useState(false)
  const [partner, setPartner] = useState<PartnerAccount | null>(null)
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([])

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const data = await getStoredData()
    setTransactions(data.partnerTransactions)

    const account = data.partners.find((p) => p.id === id)
    if (account) {
      setPartner(account)
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

  if (!partner) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <p className="text-base text-muted-foreground font-semibold">Partner account record not found</p>
          <Link href="/partners" className="text-sm font-bold text-primary hover:underline">
            Back to Partner Management
          </Link>
        </div>
      </main>
    )
  }

  // Filter transactions for this partner
  const partnerTxs = transactions.filter((tx) => tx.partnerId === id)

  // Calculations
  const totalContributions = partner.totalInvestment + partner.additionalContributions
  const closingBalance = partner.currentBalance
  const netContribution = totalContributions - partner.totalWithdrawal

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-24">

        {/* Header */}
        <header className="flex items-center gap-3.5">
          <Link 
            href="/partners" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Partner Ledger</h1>
            <p className="text-xs text-muted-foreground">Detailed capital account ledger</p>
          </div>
        </header>

        {/* Banking Capital Account Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{partner.name}</h2>
              <p className="text-xs text-primary-foreground/80 font-medium mt-1">Primary Capital Partner</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Active Partner
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Current Balance</p>
            <p className="text-3xl font-bold tracking-tight mt-1">₹{partner.currentBalance.toLocaleString("en-IN")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-5 mt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Net Contribution</p>
              <p className="text-base font-bold mt-0.5">₹{netContribution.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Opening Capital</p>
              <p className="text-base font-bold mt-0.5">₹{partner.openingBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Partner Balance Sheet Card */}
        <section className="flex flex-col gap-3.5 rounded-[28px] bg-secondary p-6 ring-1 ring-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Partner Balance Summary</h3>
          </div>

          <div className="flex flex-col gap-3 bg-card rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Opening Capital Balance</span>
              <span className="text-foreground font-bold">₹{partner.openingBalance.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Total Capital Contributions</span>
              <span className="text-emerald-600 font-bold">+ ₹{totalContributions.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pb-2.5 border-b border-border/40">
              <span>Total Capital Withdrawals</span>
              <span className="text-red-500 font-bold">- ₹{partner.totalWithdrawal.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-foreground font-black">Closing Capital Balance</span>
              <span className="text-sm font-black text-primary">₹{closingBalance.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        {/* Account Summary breakdown */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1">Account Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground">
            <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
              <span>Initial Capital</span>
              <span className="text-foreground text-sm font-bold">₹{partner.totalInvestment.toLocaleString("en-IN")}</span>
            </div>

            <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
              <span>Additional Contribution</span>
              <span className="text-foreground text-sm font-bold">₹{partner.additionalContributions.toLocaleString("en-IN")}</span>
            </div>

            <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
              <span>Withdrawals</span>
              <span className="text-red-500 text-sm font-bold">- ₹{partner.totalWithdrawal.toLocaleString("en-IN")}</span>
            </div>

            <div className="bg-card p-4 rounded-2xl ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
              <span>Adjustments</span>
              <span className="text-foreground text-sm font-bold">₹{partner.adjustments.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </section>

        {/* Partner Ledger History Timeline */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-foreground px-1">Ledger Timeline</h3>
          
          {partnerTxs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-xs">
              <p className="text-xs text-muted-foreground">No ledger events recorded.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {partnerTxs.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-3 p-4 bg-card rounded-2xl ring-1 ring-border/60 shadow-sm text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      tx.type === "Withdrawal" 
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20" 
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    }`}>
                      {tx.type}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border/40 pt-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Transaction Name</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">{partner.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</span>
                      <p className={`text-sm font-black mt-0.5 ${tx.type === "Withdrawal" ? "text-rose-600" : "text-emerald-600"}`}>
                        {tx.type === "Withdrawal" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-2.5 text-[10px] font-semibold text-muted-foreground">
                    <span className="uppercase tracking-wider">Notes</span>
                    <p className="text-foreground text-[11px] font-medium mt-0.5">{tx.notes || "-"}</p>
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
