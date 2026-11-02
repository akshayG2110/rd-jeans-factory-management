import {
  Users,
  Wallet,
  HandCoins,
  Building2,
  Package,
  Scissors,
  Archive,
  Handshake,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BarChart3,
  type LucideIcon,
} from "lucide-react"

export type Module = {
  name: string
  description: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export const modules: Module[] = [
  {
    name: "Employees",
    description: "Manage staff",
    icon: Users,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    name: "Upad",
    description: "Advances",
    icon: HandCoins,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
  {
    name: "Seth",
    description: "Clients",
    icon: Building2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    name: "Cutting",
    description: "Cut entries",
    icon: Scissors,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
  {
    name: "Finished Goods",
    description: "Garments & dispatch",
    icon: Package,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
  {
    name: "Roll Inventory",
    description: "Roll inventory",
    icon: Archive,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    name: "Partner",
    description: "Partnerships",
    icon: Handshake,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#16a34a]/10",
  },
  {
    name: "Income",
    description: "Money in",
    icon: TrendingUp,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#16a34a]/10",
  },
  {
    name: "Expense",
    description: "Money out",
    icon: TrendingDown,
    iconColor: "text-[#dc2626]",
    iconBg: "bg-[#dc2626]/10",
  },
  {
    name: "Cash Book",
    description: "Ledger",
    icon: BookOpen,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    name: "Reports",
    description: "Summaries",
    icon: BarChart3,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
]

export type Activity = {
  title: string
  description: string
  time: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export const recentActivities: Activity[] = []

export type Summary = {
  label: string
  value: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export const factorySummary: Summary[] = [
  {
    label: "Total Employees",
    value: "0",
    icon: Users,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    label: "Monthly Salary",
    value: "₹ 0",
    icon: Wallet,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#16a34a]/10",
  },
  {
    label: "Total Upad",
    value: "₹ 0",
    icon: HandCoins,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
  {
    label: "Total Seths",
    value: "0",
    icon: Building2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    label: "Fabric Received",
    value: "0 m",
    icon: Package,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#16a34a]/10",
  },
  {
    label: "Cutting Pieces",
    value: "0",
    icon: Scissors,
    iconColor: "text-[#ea580c]",
    iconBg: "bg-[#ea580c]/10",
  },
  {
    label: "Income This Month",
    value: "₹ 0",
    icon: TrendingUp,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#16a34a]/10",
  },
  {
    label: "Expense This Month",
    value: "₹ 0",
    icon: TrendingDown,
    iconColor: "text-[#dc2626]",
    iconBg: "bg-[#dc2626]/10",
  },
]
