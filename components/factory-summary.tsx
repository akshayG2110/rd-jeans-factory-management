"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Users, 
  Wallet, 
  HandCoins, 
  Building2, 
  Package, 
  Scissors, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react"
import { getStoredData, MONTH_REV } from "@/lib/employee-store"

export function FactorySummary() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState({
    employees: 0,
    monthlySalary: 0,
    totalUpad: 0,
    totalSeths: 0,
    fabricReceived: 0,
    cuttingPieces: 0,
    income: 0,
    expense: 0
  })

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
    const store = await getStoredData()
    
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonthNum = currentDate.getMonth() + 1
    const currentMonthName = MONTH_REV[currentMonthNum] || "June"
    const currentMonthPrefix = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`

    const employees = (store.employees || []).length
    
    const monthlySalary = (store.salaryRecords || [])
      .filter((s: any) => s.month === currentMonthName && String(s.year) === String(currentYear))
      .reduce((sum: number, s: any) => sum + s.salaryAmount, 0)

    const totalUpad = (store.employees || []).reduce((sum: number, e: any) => sum + (e.upad || 0), 0)
    
    const totalSeths = (store.seths || []).length
    
    const fabricReceived = (store.fabricReceives || []).reduce((sum: number, f: any) => sum + f.receivedQty, 0)
    
    const cuttingPieces = (store.cuttings || []).reduce((sum: number, c: any) => sum + c.pieces, 0)
    
    const income = (store.incomes || [])
      .filter((i: any) => (i.date || "").includes(currentMonthPrefix) && i.status === "Received")
      .reduce((sum: number, i: any) => sum + i.amount, 0)
      
    const expense = (store.expenses || [])
      .filter((e: any) => (e.date || "").includes(currentMonthPrefix) && e.status === "Paid")
      .reduce((sum: number, e: any) => sum + e.amount, 0)

    setData({
      employees,
      monthlySalary,
      totalUpad,
      totalSeths,
      fabricReceived,
      cuttingPieces,
      income,
      expense
    })
  
    };
    loadData();
}, [])

  if (!mounted) {
    return (
      <div className="h-24 w-full animate-pulse rounded-[20px] bg-muted"></div>
    )
  }

  const items = [
    { label: "Total Employees", value: `${data.employees} Staff`, href: "/employees", icon: Users, iconColor: "text-primary", iconBg: "bg-primary/10" },
    { label: "Monthly Salary", value: `₹${data.monthlySalary.toLocaleString("en-IN")}`, href: "/salary", icon: Wallet, iconColor: "text-[#16a34a]", iconBg: "bg-[#16a34a]/10" },
    { label: "Total Upad", value: `₹${data.totalUpad.toLocaleString("en-IN")}`, href: "/upad", icon: HandCoins, iconColor: "text-[#ea580c]", iconBg: "bg-[#ea580c]/10" },
    { label: "Total Seths", value: `${data.totalSeths} Clients`, href: "/seths", icon: Building2, iconColor: "text-primary", iconBg: "bg-primary/10" },
    { label: "Fabric Received", value: `${data.fabricReceived.toLocaleString("en-IN")} m`, href: "/rolls", icon: Package, iconColor: "text-[#16a34a]", iconBg: "bg-[#16a34a]/10" },
    { label: "Cutting Pieces", value: `${data.cuttingPieces.toLocaleString("en-IN")} pcs`, href: "/cutting", icon: Scissors, iconColor: "text-[#ea580c]", iconBg: "bg-[#ea580c]/10" },
    { label: "Income This Month", value: `₹${data.income.toLocaleString("en-IN")}`, href: "/income", icon: TrendingUp, iconColor: "text-[#16a34a]", iconBg: "bg-[#16a34a]/10" },
    { label: "Expense This Month", value: `₹${data.expense.toLocaleString("en-IN")}`, href: "/expense", icon: TrendingDown, iconColor: "text-[#dc2626]", iconBg: "bg-[#dc2626]/10" }
  ]

  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-foreground">Factory Summary</h2>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex w-40 shrink-0 flex-col justify-between gap-3 rounded-[20px] bg-card p-4 shadow-sm ring-1 ring-border/60 transition-transform active:scale-95 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.iconBg}`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-base font-extrabold text-foreground">{item.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
