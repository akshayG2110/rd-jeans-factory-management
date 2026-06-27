import { DashboardHeader } from "@/components/dashboard-header"
import { CashBalanceCard } from "@/components/cash-balance-card"
import { QuickAccess } from "@/components/quick-access"
import { RecentActivities } from "@/components/recent-activities"
import { FactorySummary } from "@/components/factory-summary"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 pb-12">
        <DashboardHeader />
        <CashBalanceCard />
        <QuickAccess />
        <RecentActivities />
        <FactorySummary />
      </div>
    </main>
  )
}
