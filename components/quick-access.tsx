import { modules } from "@/lib/dashboard-data"
import Link from "next/link"

export function QuickAccess() {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-foreground">Quick Access</h2>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
        {modules.map((mod) => {
          const isEmployees = mod.name === "Employees"
          const isUpad = mod.name === "Upad"
          const isSeth = mod.name === "Seth"
          const isRollInventory = mod.name === "Roll Inventory"
          const isCutting = mod.name === "Cutting"
          const isFinishedGoods = mod.name === "Finished Goods"
          const isPartner = mod.name === "Partner"
          const isIncome = mod.name === "Income"
          const isExpense = mod.name === "Expense"
          const isCashBook = mod.name === "Cash Book"
          const isReports = mod.name === "Reports"
          const Component = (isEmployees || isUpad || isSeth || isRollInventory || isCutting || isFinishedGoods || isPartner || isIncome || isExpense || isCashBook || isReports) ? Link : "button"
          
          let props = {} as any
          if (isEmployees) {
            props = { href: "/employees" }
          } else if (isUpad) {
            props = { href: "/upad" }
          } else if (isSeth) {
            props = { href: "/seths" }
          } else if (isRollInventory) {
            props = { href: "/rolls" }
          } else if (isCutting) {
            props = { href: "/cutting" }
          } else if (isFinishedGoods) {
            props = { href: "/inventory" }
          } else if (isPartner) {
            props = { href: "/partners" }
          } else if (isIncome) {
            props = { href: "/income" }
          } else if (isExpense) {
            props = { href: "/expense" }
          } else if (isCashBook) {
            props = { href: "/cashbook" }
          } else if (isReports) {
            props = { href: "/reports" }
          } else {
            props = { type: "button" }
          }

          return (
            <Component
              key={mod.name}
              {...props}
              className="flex min-h-[90px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-card p-2 shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${mod.iconBg}`}>
                <mod.icon className={`h-5 w-5 ${mod.iconColor}`} aria-hidden="true" />
              </span>
              <span className="text-center text-[11px] font-semibold leading-tight text-foreground">{mod.name}</span>
              <span className="hidden text-center text-[10px] leading-tight text-muted-foreground md:block">
                {mod.description}
              </span>
            </Component>
          )
        })}
      </div>
    </section>
  )
}

