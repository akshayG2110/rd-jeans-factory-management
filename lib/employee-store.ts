"use client"

import { apiFetch } from "./api"

export interface Transaction {
  id: string
  employeeId: string
  type: "salary" | "upad"
  amount: number
  date: string
  description: string
  paymentMethod?: string
  notes?: string
  handledBy?: string
  status?: "Pending" | "Settled" | "Cancelled"
  settledInSalaryId?: string | null
  settledAt?: string | null
}

export interface Employee {
  id: string
  name: string
  role:
    | "Stitching Worker"
    | "Cutting Worker"
    | "Helper"
    | "Indoor Staff"
    | "Outdoor Staff"
    | "Supervisor"
  upad: number
  status: "active" | "inactive"
  createdAt: string
  salary: number
}

export interface SalaryRecord {
  id: string
  employeeId: string
  employeeName: string
  role: Employee["role"]
  month: string
  year: string
  salaryAmount: number
  totalUpadDeducted?: number
  netPayable?: number
  paidAmount: number
  remainingAmount: number
  status: "Paid" | "Partially Paid" | "Pending"
  notes: string
  date: string
  paymentMethod?: string
  handledBy?: string
  settledUpadIds?: number[]
  settledUpads?: any[]
}

export interface Seth {
  id: string
  name: string
  contact: string
  address: string
  notes: string
  totalFabric: number
  totalRolls: number
  totalCuttingPieces: number
  totalCuttingLots: number
  status: "Active" | "Inactive"
}

export interface FabricHistory {
  id: string
  sethId: string
  date: string
  rollNo: string
  meters: number
  type: string
}

export interface RollTracking {
  id: string
  sethId: string
  rollNo: string
  receivedQty: number
  usedQty: number
  remainingQty: number
  status: "Full" | "Partial" | "Empty"
}

export interface ProductionHistory {
  id: string
  sethId: string
  lotNo: string
  cuttingDate: string
  piecesGenerated: number
  metersUsed: number
}

export interface PaymentHistory {
  id: string
  sethId: string
  date: string
  amount: number
  remarks: string
}

export interface FabricReceive {
  id: string
  rollNo: string
  shortNo: string
  sethId: string
  sethName: string
  fabricType: string
  receivedQty: number
  usedQty: number
  remainingQty: number
  date: string
  status: "Active" | "Partially Used" | "Completed"
  notes: string
}

export interface FabricHistoryLog {
  id: string
  receiveId: string
  date: string
  action: string
  qty: number
  remarks: string
}

export interface CuttingEntry {
  id: string
  lotNo: string
  date: string
  rollId: string
  rollNo: string
  employeeId?: string
  employeeName?: string
  employeeRole?: string
  meterUsed: number
  pieces: number
  size: string
  status: "Completed" | "In Progress" | "Cancelled"
  layerInfo: string
  pana: string
  average: string
  sortNo: string
  notes: string
}

export interface CuttingHistoryLog {
  id: string
  cuttingId: string
  date: string
  event: string
  qty: number
  remarks: string
}

export interface FinishedGoodsItem {
  id: string
  cuttingId: string
  sethId?: string
  sethName?: string
  lotNumber: string
  itemName: string
  size: string
  colorShade: string
  totalPieces: number
  stitchingPieces: number
  finishedPieces: number
  rejectedPieces: number
  dispatchedPieces: number
  status: "Cut" | "In Stitching" | "Washing" | "Ready" | "Dispatched" | "Closed"
  unitPrice: number
  dispatchDate?: string
  notes?: string
  createdAt: string
  rollNumber?: string
  fabricType?: string
  cutterName?: string
}

export interface PartnerAccount {
  id: string
  name: string
  mobileNumber?: string
  profitSharePercentage?: number
  openingBalance: number
  currentBalance: number
  totalInvestment: number
  totalWithdrawal: number
  additionalContributions: number
  adjustments: number
  status?: "Active" | "Inactive"
  notes?: string
  cashInHandled?: number
  cashOutHandled?: number
  netCashHandled?: number
}

export interface PartnerTransaction {
  id: string
  partnerId: string
  partnerName: string
  type: "Capital Investment" | "Drawing (Personal Withdrawal)" | "Profit Share" | "Cash Transfer" | "Adjustment" | "Investment" | "Withdrawal"
  date: string
  amount: number
  paymentMethod?: string
  notes: string
}

export interface IncomeRecord {
  id: string
  source: "Payment Received From Seth" | "Other Income"
  amount: number
  date: string
  refNo: string
  notes: string
  status: "Received" | "Pending" | "Cancelled"
  handledBy?: string
  paymentMethod?: string
  partyName?: string
}

export interface IncomeHistoryLog {
  id: string
  incomeId: string
  date: string
  action: string
  amount: number
  remarks: string
}

export interface ExpenseRecord {
  id: string
  title: string
  category: "Salary" | "Upad" | "Transport" | "Electricity" | "Rent" | "Maintenance" | "Miscellaneous"
  amount: number
  date: string
  paymentMethod: "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "GPay"
  refNo: string
  remarks: string
  status: "Paid" | "Pending" | "Cancelled"
  handledBy?: string
  partyName?: string
}

export interface ExpenseHistoryLog {
  id: string
  expenseId: string
  date: string
  action: string
  amount: number
  remarks: string
}

export interface CashBookRecord {
  id: string
  date: string
  type: "Money In" | "Money Out"
  category: "Income" | "Expense" | "Salary Payment" | "Upad Payment" | "Partner Transaction" | "Other Transaction"
  partyName: string
  amount: number
  refNo: string
  remarks: string
  handledBy?: string
  paymentMethod?: string
  balance?: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Month utility mappings
export const MONTH_MAP: { [key: string]: number } = {
  "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
  "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
}
export const MONTH_REV: { [key: number]: string } = {
  1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
  7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
}

// Global cached Store for runtime fallback in case network errors occur
let FALLBACK_STORE = {
  employees: [] as Employee[],
  transactions: [] as Transaction[],
  salaryRecords: [] as SalaryRecord[],
  seths: [] as Seth[],
  fabricHistories: [] as FabricHistory[],
  rollTrackings: [] as RollTracking[],
  productionHistories: [] as ProductionHistory[],
  paymentHistories: [] as PaymentHistory[],
  fabricReceives: [] as FabricReceive[],
  fabricHistoryLogs: [] as FabricHistoryLog[],
  cuttings: [] as CuttingEntry[],
  cuttingHistoryLogs: [] as CuttingHistoryLog[],
  partners: [
    { id: "pt-1", name: "Rajubhai", openingBalance: 0, currentBalance: 0, totalInvestment: 0, totalWithdrawal: 0, additionalContributions: 0, adjustments: 0 },
    { id: "pt-2", name: "Dhruveshbhai", openingBalance: 0, currentBalance: 0, totalInvestment: 0, totalWithdrawal: 0, additionalContributions: 0, adjustments: 0 }
  ] as PartnerAccount[],
  partnerTransactions: [] as PartnerTransaction[],
  incomes: [] as IncomeRecord[],
  incomeHistoryLogs: [] as IncomeHistoryLog[],
  expenses: [] as ExpenseRecord[],
  expenseHistoryLogs: [] as ExpenseHistoryLog[],
  cashBook: [] as CashBookRecord[],
  finishedGoods: [] as FinishedGoodsItem[]
}

// ----------------------------------------------------
// ASYNC API CLIENT HELPERS
// ----------------------------------------------------

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const res = await apiFetch(`${API_BASE}/employees`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((e: any) => ({
        id: String(e.id),
        name: e.employee_name,
        role: e.role,
        upad: 0, // dynamic aggregate calculations or default
        status: (e.status || "").toLowerCase() === "active" ? "active" : "inactive",
        createdAt: e.joining_date,
        salary: 0 // default value
      }))
    }
  } catch (err) {
    console.error("fetchEmployees failed", err)
  }
  return FALLBACK_STORE.employees
}

export async function createEmployee(emp: Partial<Employee>): Promise<Employee | null> {
  try {
    const payload = {
      employee_name: emp.name,
      role: emp.role,
      joining_date: emp.createdAt || new Date().toISOString().split("T")[0],
      status: emp.status === "active" ? "Active" : "Inactive"
    }
    const res = await apiFetch(`${API_BASE}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        name: body.data.employee_name,
        role: body.data.role,
        upad: 0,
        status: (body.data.status || "").toLowerCase() === "active" ? "active" : "inactive",
        createdAt: body.data.joining_date,
        salary: 0
      }
    }
  } catch (err) {
    console.error("createEmployee failed", err)
  }
  return null
}

export async function updateEmployee(empId: string, emp: Partial<Employee>): Promise<Employee | null> {
  try {
    const payload = {
      employee_name: emp.name,
      role: emp.role,
      status: emp.status === "active" ? "Active" : "Inactive"
    }
    const res = await apiFetch(`${API_BASE}/employees/${empId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        name: body.data.employee_name,
        role: body.data.role,
        upad: 0,
        status: (body.data.status || "").toLowerCase() === "active" ? "active" : "inactive",
        createdAt: body.data.joining_date,
        salary: 0
      }
    }
  } catch (err) {
    console.error("updateEmployee failed", err)
  }
  return null
}

export async function fetchUpads(employeeId?: string): Promise<Transaction[]> {
  try {
    const url = employeeId ? `${API_BASE}/upad?employee_id=${employeeId}` : `${API_BASE}/upad`
    const res = await apiFetch(url)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((u: any) => ({
        id: String(u.id),
        employeeId: String(u.employee_id),
        type: "upad" as const,
        amount: parseFloat(u.amount),
        date: u.date,
        description: u.notes || "Advance Payment",
        paymentMethod: u.payment_method,
        notes: u.notes,
        handledBy: u.handled_by,
        status: (u.status || "Pending") as "Pending" | "Settled" | "Cancelled",
        settledInSalaryId: u.settled_in_salary_id ? String(u.settled_in_salary_id) : null,
        settledAt: u.settled_at || null
      }))
    }
  } catch (err) {
    console.error("fetchUpads failed", err)
  }
  return FALLBACK_STORE.transactions
}

export async function createUpad(upad: Partial<Transaction>): Promise<Transaction | null> {
  try {
    const payload = {
      employee_id: parseInt(upad.employeeId || "0"),
      date: upad.date,
      amount: upad.amount,
      payment_method: upad.paymentMethod || "Cash",
      notes: upad.notes || upad.description,
      handled_by: upad.handledBy
    }
    const res = await apiFetch(`${API_BASE}/upad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.detail || body.message || "Failed to create upad advance.")
    }
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        employeeId: String(body.data.employee_id),
        type: "upad" as const,
        amount: parseFloat(body.data.amount),
        date: body.data.date,
        description: body.data.notes || "Advance Payment",
        paymentMethod: body.data.payment_method,
        notes: body.data.notes,
        handledBy: body.data.handled_by,
        status: (body.data.status || "Pending") as "Pending" | "Settled" | "Cancelled",
        settledInSalaryId: body.data.settled_in_salary_id ? String(body.data.settled_in_salary_id) : null,
        settledAt: body.data.settled_at || null
      }
    }
  } catch (err: any) {
    console.error("createUpad failed", err)
    throw err
  }
  return null
}

export async function fetchSalaries(employeeId?: string): Promise<SalaryRecord[]> {
  try {
    const url = employeeId ? `${API_BASE}/salary?employee_id=${employeeId}` : `${API_BASE}/salary`
    const res = await apiFetch(url)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((s: any) => ({
        id: String(s.id),
        employeeId: String(s.employee_id),
        employeeName: s.employee ? s.employee.employee_name : "Employee",
        role: s.employee ? s.employee.role : "Stitching Worker",
        month: MONTH_REV[s.salary_month] || "June",
        year: String(s.salary_year),
        salaryAmount: parseFloat(s.salary_amount),
        totalUpadDeducted: parseFloat(s.total_upad_deducted || 0),
        netPayable: parseFloat(s.net_payable ?? s.salary_amount),
        paidAmount: parseFloat(s.paid_amount),
        remainingAmount: parseFloat(s.remaining_amount),
        status: s.remaining_amount <= 0 ? ("Paid" as const) : s.paid_amount > 0 ? ("Partially Paid" as const) : ("Pending" as const),
        notes: s.notes || "",
        date: s.payment_date,
        paymentMethod: s.payment_method,
        handledBy: s.handled_by,
        settledUpadIds: s.settled_upad_ids || []
      }))
    }
  } catch (err) {
    console.error("fetchSalaries failed", err)
  }
  return FALLBACK_STORE.salaryRecords
}

export async function createSalary(sal: Partial<SalaryRecord> & { deductUpad?: boolean; upadIds?: number[] }): Promise<SalaryRecord | null> {
  try {
    const payload = {
      employee_id: parseInt(sal.employeeId || "0"),
      salary_month: MONTH_MAP[sal.month || "June"] || 6,
      salary_year: parseInt(sal.year || "2026"),
      salary_amount: sal.salaryAmount,
      paid_amount: sal.paidAmount,
      payment_method: sal.paymentMethod || "Cash",
      notes: sal.notes || "",
      handled_by: sal.handledBy,
      payment_date: sal.date || new Date().toISOString().split("T")[0],
      deduct_upad: sal.deductUpad !== undefined ? sal.deductUpad : true,
      upad_ids: sal.upadIds
    }
    const res = await apiFetch(`${API_BASE}/salary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        employeeId: String(body.data.employee_id),
        employeeName: sal.employeeName || "",
        role: sal.role || "Stitching Worker",
        month: MONTH_REV[body.data.salary_month] || "June",
        year: String(body.data.salary_year),
        salaryAmount: parseFloat(body.data.salary_amount),
        totalUpadDeducted: parseFloat(body.data.total_upad_deducted || 0),
        netPayable: parseFloat(body.data.net_payable ?? body.data.salary_amount),
        paidAmount: parseFloat(body.data.paid_amount),
        remainingAmount: parseFloat(body.data.remaining_amount),
        status: body.data.remaining_amount <= 0 ? ("Paid" as const) : body.data.paid_amount > 0 ? ("Partially Paid" as const) : ("Pending" as const),
        notes: body.data.notes || "",
        date: body.data.payment_date,
        paymentMethod: body.data.payment_method,
        handledBy: body.data.handled_by,
        settledUpadIds: body.data.settled_upad_ids || []
      }
    }
  } catch (err: any) {
    console.error("createSalary failed", err)
    throw err
  }
  return null
}

export async function updateSalary(salId: string, sal: Partial<SalaryRecord>): Promise<SalaryRecord | null> {
  try {
    const payload = {
      salary_month: sal.month ? MONTH_MAP[sal.month] : undefined,
      salary_year: sal.year ? parseInt(sal.year) : undefined,
      salary_amount: sal.salaryAmount,
      paid_amount: sal.paidAmount,
      payment_method: sal.paymentMethod,
      notes: sal.notes,
      handled_by: sal.handledBy,
      payment_date: sal.date
    }
    const res = await apiFetch(`${API_BASE}/salary/${salId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        employeeId: String(body.data.employee_id),
        employeeName: sal.employeeName || "",
        role: sal.role || "Stitching Worker",
        month: MONTH_REV[body.data.salary_month] || "June",
        year: String(body.data.salary_year),
        salaryAmount: parseFloat(body.data.salary_amount),
        paidAmount: parseFloat(body.data.paid_amount),
        remainingAmount: parseFloat(body.data.remaining_amount),
        status: body.data.remaining_amount <= 0 ? "Paid" as const : body.data.paid_amount > 0 ? "Partially Paid" as const : "Pending" as const,
        notes: body.data.notes || "",
        date: body.data.payment_date,
        paymentMethod: body.data.payment_method,
        handledBy: body.data.handled_by
      }
    }
  } catch (err) {
    console.error("updateSalary failed", err)
  }
  return null
}

export async function fetchExpenses(): Promise<ExpenseRecord[]> {
  try {
    const res = await apiFetch(`${API_BASE}/expenses`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((e: any) => ({
        id: String(e.id),
        title: e.notes || e.expense_category,
        category: e.expense_category,
        amount: parseFloat(e.amount),
        date: e.expense_date,
        paymentMethod: e.payment_method,
        refNo: e.reference_number || "",
        remarks: e.notes || "",
        status: "Paid" as const,
        handledBy: e.handled_by,
        partyName: e.party_name
      }))
    }
  } catch (err) {
    console.error("fetchExpenses failed", err)
  }
  return FALLBACK_STORE.expenses
}

export async function createExpense(exp: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
  try {
    const payload = {
      expense_date: exp.date || new Date().toISOString().split("T")[0],
      expense_category: exp.category || "Miscellaneous",
      party_name: exp.partyName || "General Party",
      amount: exp.amount,
      payment_method: exp.paymentMethod || "Cash",
      handled_by: exp.handledBy,
      reference_number: exp.refNo || "",
      notes: exp.remarks || ""
    }
    const res = await apiFetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        title: body.data.notes || body.data.expense_category,
        category: body.data.expense_category,
        amount: parseFloat(body.data.amount),
        date: body.data.expense_date,
        paymentMethod: body.data.payment_method,
        refNo: body.data.reference_number || "",
        remarks: body.data.notes || "",
        status: "Paid" as const,
        handledBy: body.data.handled_by,
        partyName: body.data.party_name
      }
    }
  } catch (err) {
    console.error("createExpense failed", err)
  }
  return null
}

export async function updateExpense(expId: string, exp: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
  try {
    const payload = {
      expense_date: exp.date,
      expense_category: exp.category,
      party_name: exp.partyName,
      amount: exp.amount,
      payment_method: exp.paymentMethod,
      handled_by: exp.handledBy,
      reference_number: exp.refNo,
      notes: exp.remarks
    }
    const res = await apiFetch(`${API_BASE}/expenses/${expId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        title: body.data.notes || body.data.expense_category,
        category: body.data.expense_category,
        amount: parseFloat(body.data.amount),
        date: body.data.expense_date,
        paymentMethod: body.data.payment_method,
        refNo: body.data.reference_number || "",
        remarks: body.data.notes || "",
        status: "Paid" as const,
        handledBy: body.data.handled_by,
        partyName: body.data.party_name
      }
    }
  } catch (err) {
    console.error("updateExpense failed", err)
  }
  return null
}

export async function fetchIncomes(): Promise<IncomeRecord[]> {
  try {
    const res = await apiFetch(`${API_BASE}/income`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((i: any) => ({
        id: String(i.id),
        source: i.income_source === "Seth Payment" ? "Payment Received From Seth" : i.income_source,
        amount: parseFloat(i.amount),
        date: i.income_date,
        refNo: i.reference_number || "",
        notes: i.notes || "",
        status: "Received" as const,
        handledBy: i.handled_by,
        paymentMethod: i.payment_method,
        partyName: i.source_name
      }))
    }
  } catch (err) {
    console.error("fetchIncomes failed", err)
  }
  return FALLBACK_STORE.incomes
}

export async function createIncome(inc: Partial<IncomeRecord>): Promise<IncomeRecord | null> {
  try {
    const payload = {
      income_date: inc.date || new Date().toISOString().split("T")[0],
      income_source: inc.source === "Payment Received From Seth" ? "Seth Payment" : (inc.source || "Other Income"),
      source_name: inc.partyName || "General Income Source",
      amount: inc.amount,
      payment_method: inc.paymentMethod || "Cash",
      handled_by: inc.handledBy,
      reference_number: inc.refNo || "",
      notes: inc.notes || ""
    }
    const res = await apiFetch(`${API_BASE}/income`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.detail || body.message || "Failed to create income entry.")
    }
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        source: body.data.income_source === "Seth Payment" ? "Payment Received From Seth" : body.data.income_source,
        amount: parseFloat(body.data.amount),
        date: body.data.income_date,
        refNo: body.data.reference_number || "",
        notes: body.data.notes || "",
        status: "Received" as const,
        handledBy: body.data.handled_by,
        paymentMethod: body.data.payment_method,
        partyName: body.data.source_name
      }
    }
  } catch (err: any) {
    console.error("createIncome failed", err)
    throw err
  }
  return null
}

export async function updateIncome(incId: string, inc: Partial<IncomeRecord>): Promise<IncomeRecord | null> {
  try {
    const payload = {
      income_date: inc.date,
      income_source: inc.source ? (inc.source === "Payment Received From Seth" ? "Seth Payment" : inc.source) : undefined,
      source_name: inc.partyName,
      amount: inc.amount,
      payment_method: inc.paymentMethod,
      handled_by: inc.handledBy,
      reference_number: inc.refNo,
      notes: inc.notes
    }
    const res = await apiFetch(`${API_BASE}/income/${incId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.detail || body.message || "Failed to update income entry.")
    }
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        source: body.data.income_source === "Seth Payment" ? "Payment Received From Seth" : body.data.income_source,
        amount: parseFloat(body.data.amount),
        date: body.data.income_date,
        refNo: body.data.reference_number || "",
        notes: body.data.notes || "",
        status: "Received" as const,
        handledBy: body.data.handled_by,
        paymentMethod: body.data.payment_method,
        partyName: body.data.source_name
      }
    }
  } catch (err: any) {
    console.error("updateIncome failed", err)
    throw err
  }
  return null
}

export async function fetchCashBook(): Promise<CashBookRecord[]> {
  try {
    const res = await apiFetch(`${API_BASE}/cashbook`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((c: any) => {
        const incomeVal = parseFloat(c.Income || c.income_amount || 0);
        const outVal = parseFloat(c.Out || c.out_amount || 0);
        const refMod = c.reference_module || c.Category || "";
        const refId = c.reference_id || c.id || "";
        return {
          id: String(c.id),
          date: c.Date || c.transaction_date || "",
          type: incomeVal > 0 ? ("Money In" as const) : ("Money Out" as const),
          category: c.Category || c.transaction_type || "Other Transaction",
          partyName: c.Name || c.name || "Unknown",
          amount: incomeVal > 0 ? incomeVal : outVal,
          refNo: refMod && refId ? `${refMod}-${refId}` : "N/A",
          remarks: c.Notes || c.notes || "",
          handledBy: c["Handled By"] || c.handled_by || "Unknown",
          paymentMethod: c.Method || c.payment_method || "Cash",
          balance: parseFloat(c.Balance || c.running_balance || 0)
        };
      })
    }
  } catch (err) {
    console.error("fetchCashBook failed", err)
  }
  return FALLBACK_STORE.cashBook
}

export async function fetchSeths(): Promise<Seth[]> {
  try {
    const res = await apiFetch(`${API_BASE}/seths`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((s: any) => ({
        id: String(s.id),
        name: s.seth_name,
        contact: s.mobile_number || "",
        address: s.address || "",
        notes: s.notes || "",
        totalFabric: 0,
        totalRolls: 0,
        totalCuttingPieces: 0,
        totalCuttingLots: 0,
        status: s.status === "Active" ? ("Active" as const) : ("Inactive" as const)
      }))
    }
  } catch (err) {
    console.error("fetchSeths failed", err)
  }
  return FALLBACK_STORE.seths
}

export async function createSeth(seth: Partial<Seth>): Promise<Seth | null> {
  try {
    const payload = {
      seth_name: seth.name,
      mobile_number: seth.contact,
      address: seth.address,
      notes: seth.notes,
      status: seth.status || "Active"
    }
    const res = await apiFetch(`${API_BASE}/seths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        name: body.data.seth_name,
        contact: body.data.mobile_number || "",
        address: body.data.address || "",
        notes: body.data.notes || "",
        totalFabric: 0,
        totalRolls: 0,
        totalCuttingPieces: 0,
        totalCuttingLots: 0,
        status: body.data.status === "Active" ? ("Active" as const) : ("Inactive" as const)
      }
    }
  } catch (err) {
    console.error("createSeth failed", err)
  }
  return null
}

export async function updateSeth(sethId: string, seth: Partial<Seth>): Promise<Seth | null> {
  try {
    const payload = {
      seth_name: seth.name,
      mobile_number: seth.contact,
      address: seth.address,
      notes: seth.notes,
      status: seth.status
    }
    const res = await apiFetch(`${API_BASE}/seths/${sethId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        name: body.data.seth_name,
        contact: body.data.mobile_number || "",
        address: body.data.address || "",
        notes: body.data.notes || "",
        totalFabric: 0,
        totalRolls: 0,
        totalCuttingPieces: 0,
        totalCuttingLots: 0,
        status: body.data.status === "Active" ? ("Active" as const) : ("Inactive" as const)
      }
    }
  } catch (err) {
    console.error("updateSeth failed", err)
  }
  return null
}


export async function fetchFabricReceives(): Promise<FabricReceive[]> {
  try {
    const res = await apiFetch(`${API_BASE}/rolls`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((r: any) => ({
        id: String(r.id),
        rollNo: r.roll_number,
        shortNo: r.short_number,
        sethId: String(r.seth_id),
        sethName: r.seth ? r.seth.seth_name : "Seth Client",
        fabricType: r.fabric_type,
        receivedQty: parseFloat(r.received_meter),
        usedQty: parseFloat(r.used_meter),
        remainingQty: parseFloat(r.remaining_meter),
        date: r.entry_date,
        status: r.status,
        notes: r.notes || ""
      }))
    }
  } catch (err) {
    console.error("fetchFabricReceives failed", err)
  }
  return FALLBACK_STORE.fabricReceives
}

export async function createFabricReceive(r: Partial<FabricReceive>): Promise<FabricReceive | null> {
  try {
    const payload = {
      seth_id: parseInt(r.sethId || "0"),
      entry_date: r.date || new Date().toISOString().split("T")[0],
      roll_number: r.rollNo,
      short_number: r.shortNo,
      fabric_type: r.fabricType,
      received_meter: r.receivedQty,
      notes: r.notes || ""
    }
    const res = await apiFetch(`${API_BASE}/rolls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        rollNo: body.data.roll_number,
        shortNo: body.data.short_number,
        sethId: String(body.data.seth_id),
        sethName: r.sethName || "Seth Client",
        fabricType: body.data.fabric_type,
        receivedQty: parseFloat(body.data.received_meter),
        usedQty: parseFloat(body.data.used_meter),
        remainingQty: parseFloat(body.data.remaining_meter),
        date: body.data.entry_date,
        status: body.data.status,
        notes: body.data.notes || ""
      }
    }
  } catch (err) {
    console.error("createFabricReceive failed", err)
  }
  return null
}

export async function updateFabricReceive(rollId: string, r: Partial<FabricReceive>): Promise<FabricReceive | null> {
  try {
    const payload = {
      seth_id: r.sethId ? parseInt(r.sethId) : undefined,
      entry_date: r.date,
      roll_number: r.rollNo,
      short_number: r.shortNo,
      fabric_type: r.fabricType,
      received_meter: r.receivedQty,
      notes: r.notes
    }
    const res = await apiFetch(`${API_BASE}/rolls/${rollId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        rollNo: body.data.roll_number,
        shortNo: body.data.short_number,
        sethId: String(body.data.seth_id),
        sethName: r.sethName || "Seth Client",
        fabricType: body.data.fabric_type,
        receivedQty: parseFloat(body.data.received_meter),
        usedQty: parseFloat(body.data.used_meter),
        remainingQty: parseFloat(body.data.remaining_meter),
        date: body.data.entry_date,
        status: body.data.status,
        notes: body.data.notes || ""
      }
    }
  } catch (err) {
    console.error("updateFabricReceive failed", err)
  }
  return null
}

export async function fetchCuttings(): Promise<CuttingEntry[]> {
  try {
    const res = await apiFetch(`${API_BASE}/cutting`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((c: any) => ({
        id: String(c.id),
        lotNo: c.lot_number,
        date: c.cutting_date,
        rollId: String(c.roll_id),
        rollNo: c.roll ? c.roll.roll_number : (c.roll_number || "Roll ID"),
        employeeId: c.employee_id ? String(c.employee_id) : undefined,
        employeeName: c.employee_name || undefined,
        employeeRole: c.employee_role || undefined,
        meterUsed: parseFloat(c.meter_used),
        pieces: c.piece_count,
        size: c.size,
        status: "Completed" as const,
        layerInfo: c.layer_information || "",
        pana: c.pana ? String(c.pana) : "",
        average: c.average ? String(c.average) : "",
        sortNo: c.sort_number || "",
        notes: c.notes || ""
      }))
    }
  } catch (err) {
    console.error("fetchCuttings failed", err)
  }
  return FALLBACK_STORE.cuttings
}

export async function createCutting(c: Partial<CuttingEntry>): Promise<CuttingEntry | null> {
  try {
    const payload = {
      cutting_date: c.date || new Date().toISOString().split("T")[0],
      lot_number: c.lotNo,
      roll_id: parseInt(c.rollId || "0"),
      employee_id: c.employeeId ? parseInt(c.employeeId, 10) : null,
      meter_used: c.meterUsed,
      layer_information: c.layerInfo || "",
      piece_count: c.pieces,
      size: c.size,
      pana: c.pana ? parseFloat(c.pana) : null,
      average: c.average ? parseFloat(c.average) : null,
      sort_number: c.sortNo || "",
      notes: c.notes || ""
    }
    const res = await apiFetch(`${API_BASE}/cutting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        lotNo: body.data.lot_number,
        date: body.data.cutting_date,
        rollId: String(body.data.roll_id),
        rollNo: c.rollNo || body.data.roll_number || "Roll ID",
        employeeId: body.data.employee_id ? String(body.data.employee_id) : undefined,
        employeeName: body.data.employee_name || undefined,
        employeeRole: body.data.employee_role || undefined,
        meterUsed: parseFloat(body.data.meter_used),
        pieces: body.data.piece_count,
        size: body.data.size,
        status: "Completed" as const,
        layerInfo: body.data.layer_information || "",
        pana: body.data.pana ? String(body.data.pana) : "",
        average: body.data.average ? String(body.data.average) : "",
        sortNo: body.data.sort_number || "",
        notes: body.data.notes || ""
      }
    }
  } catch (err) {
    console.error("createCutting failed", err)
  }
  return null
}

export async function updateCutting(cutId: string, c: Partial<CuttingEntry>): Promise<CuttingEntry | null> {
  try {
    const payload = {
      cutting_date: c.date,
      lot_number: c.lotNo,
      roll_id: c.rollId ? parseInt(c.rollId) : undefined,
      employee_id: c.employeeId !== undefined ? (c.employeeId ? parseInt(c.employeeId, 10) : null) : undefined,
      meter_used: c.meterUsed,
      layer_information: c.layerInfo,
      piece_count: c.pieces,
      size: c.size,
      pana: c.pana ? parseFloat(c.pana) : undefined,
      average: c.average ? parseFloat(c.average) : undefined,
      sort_number: c.sortNo,
      notes: c.notes
    }
    const res = await apiFetch(`${API_BASE}/cutting/${cutId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      return {
        id: String(body.data.id),
        lotNo: body.data.lot_number,
        date: body.data.cutting_date,
        rollId: String(body.data.roll_id),
        rollNo: c.rollNo || body.data.roll_number || "Roll ID",
        employeeId: body.data.employee_id ? String(body.data.employee_id) : undefined,
        employeeName: body.data.employee_name || undefined,
        employeeRole: body.data.employee_role || undefined,
        meterUsed: parseFloat(body.data.meter_used),
        pieces: body.data.piece_count,
        size: body.data.size,
        status: "Completed" as const,
        layerInfo: body.data.layer_information || "",
        pana: body.data.pana ? String(body.data.pana) : "",
        average: body.data.average ? String(body.data.average) : "",
        sortNo: body.data.sort_number || "",
        notes: body.data.notes || ""
      }
    }
  } catch (err) {
    console.error("updateCutting failed", err)
  }
  return null
}

export async function fetchFinishedGoods(filters?: { cuttingId?: string; sethId?: string; status?: string; search?: string }): Promise<FinishedGoodsItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.cuttingId) params.append('cutting_id', filters.cuttingId)
    if (filters?.sethId) params.append('seth_id', filters.sethId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)

    const url = `${API_BASE}/finished-goods${params.toString() ? '?' + params.toString() : ''}`
    const res = await apiFetch(url)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((item: any) => ({
        id: String(item.id),
        cuttingId: String(item.cutting_id),
        sethId: item.seth_id ? String(item.seth_id) : undefined,
        sethName: item.seth_name || undefined,
        lotNumber: item.lot_number,
        itemName: item.item_name,
        size: item.size,
        colorShade: item.color_shade,
        totalPieces: item.total_pieces,
        stitchingPieces: item.stitching_pieces,
        finishedPieces: item.finished_pieces,
        rejectedPieces: item.rejected_pieces,
        dispatchedPieces: item.dispatched_pieces,
        status: item.status,
        unitPrice: parseFloat(item.unit_price || '0'),
        dispatchDate: item.dispatch_date || undefined,
        notes: item.notes || undefined,
        createdAt: item.created_at,
        rollNumber: item.roll_number,
        fabricType: item.fabric_type,
        cutterName: item.cutter_name
      }))
    }
  } catch (err) {
    console.error("fetchFinishedGoods failed", err)
  }
  return FALLBACK_STORE.finishedGoods || []
}

export async function createFinishedGoodsItem(item: Partial<FinishedGoodsItem>): Promise<FinishedGoodsItem | null> {
  try {
    const payload = {
      cutting_id: parseInt(item.cuttingId || '0', 10),
      seth_id: item.sethId ? parseInt(item.sethId, 10) : null,
      lot_number: item.lotNumber,
      item_name: item.itemName,
      size: item.size,
      color_shade: item.colorShade,
      total_pieces: item.totalPieces,
      stitching_pieces: item.stitchingPieces,
      finished_pieces: item.finishedPieces,
      rejected_pieces: item.rejectedPieces,
      dispatched_pieces: item.dispatchedPieces,
      status: item.status,
      unit_price: item.unitPrice,
      dispatch_date: item.dispatchDate,
      notes: item.notes
    }
    const res = await apiFetch(`${API_BASE}/finished-goods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      const rec = body.data
      return {
        id: String(rec.id),
        cuttingId: String(rec.cutting_id),
        sethId: rec.seth_id ? String(rec.seth_id) : undefined,
        sethName: rec.seth_name,
        lotNumber: rec.lot_number,
        itemName: rec.item_name,
        size: rec.size,
        colorShade: rec.color_shade,
        totalPieces: rec.total_pieces,
        stitchingPieces: rec.stitching_pieces,
        finishedPieces: rec.finished_pieces,
        rejectedPieces: rec.rejected_pieces,
        dispatchedPieces: rec.dispatched_pieces,
        status: rec.status,
        unitPrice: parseFloat(rec.unit_price || '0'),
        dispatchDate: rec.dispatch_date,
        notes: rec.notes,
        createdAt: rec.created_at,
        rollNumber: rec.roll_number,
        fabricType: rec.fabric_type,
        cutterName: rec.cutter_name
      }
    }
  } catch (err) {
    console.error("createFinishedGoodsItem failed", err)
  }
  return null
}

export async function updateFinishedGoodsItem(id: string, item: Partial<FinishedGoodsItem>): Promise<FinishedGoodsItem | null> {
  try {
    const payload = {
      seth_id: item.sethId ? parseInt(item.sethId, 10) : undefined,
      item_name: item.itemName,
      size: item.size,
      color_shade: item.colorShade,
      total_pieces: item.totalPieces,
      stitching_pieces: item.stitchingPieces,
      finished_pieces: item.finishedPieces,
      rejected_pieces: item.rejectedPieces,
      dispatched_pieces: item.dispatchedPieces,
      status: item.status,
      unit_price: item.unitPrice,
      dispatch_date: item.dispatchDate,
      notes: item.notes
    }
    const res = await apiFetch(`${API_BASE}/finished-goods/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      const rec = body.data
      return {
        id: String(rec.id),
        cuttingId: String(rec.cutting_id),
        sethId: rec.seth_id ? String(rec.seth_id) : undefined,
        sethName: rec.seth_name,
        lotNumber: rec.lot_number,
        itemName: rec.item_name,
        size: rec.size,
        colorShade: rec.color_shade,
        totalPieces: rec.total_pieces,
        stitchingPieces: rec.stitching_pieces,
        finishedPieces: rec.finished_pieces,
        rejectedPieces: rec.rejected_pieces,
        dispatchedPieces: rec.dispatched_pieces,
        status: rec.status,
        unitPrice: parseFloat(rec.unit_price || '0'),
        dispatchDate: rec.dispatch_date,
        notes: rec.notes,
        createdAt: rec.created_at,
        rollNumber: rec.roll_number,
        fabricType: rec.fabric_type,
        cutterName: rec.cutter_name
      }
    }
  } catch (err) {
    console.error("updateFinishedGoodsItem failed", err)
  }
  return null
}

export async function deleteFinishedGoodsItem(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/finished-goods/${id}`, { method: "DELETE" })
    const body = await res.json()
    return body.success === true
  } catch (err) {
    console.error("deleteFinishedGoodsItem failed", err)
    return false
  }
}

export async function fetchFinishedGoodsSummary(): Promise<any> {
  try {
    const res = await apiFetch(`${API_BASE}/finished-goods/summary`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data
    }
  } catch (err) {
    console.error("fetchFinishedGoodsSummary failed", err)
  }
  return {
    totalCut: 0,
    totalInStitching: 0,
    totalReady: 0,
    totalDispatched: 0,
    totalRejected: 0,
    totalBatches: 0
  }
}

export async function fetchPartners(): Promise<PartnerAccount[]> {
  try {
    const res = await apiFetch(`${API_BASE}/partners`)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        mobileNumber: p.mobile_number,
        profitSharePercentage: parseFloat(p.profit_share_percentage || '50'),
        openingBalance: parseFloat(p.opening_balance || '0'),
        currentBalance: parseFloat(p.equity_balance ?? p.current_balance ?? '0'),
        totalInvestment: parseFloat(p.total_invested || '0'),
        totalWithdrawal: parseFloat(p.total_drawings || '0'),
        additionalContributions: 0,
        adjustments: 0,
        status: p.status || "Active",
        notes: p.notes,
        cashInHandled: parseFloat(p.cash_in_handled || '0'),
        cashOutHandled: parseFloat(p.cash_out_handled || '0'),
        netCashHandled: parseFloat(p.net_cash_handled || '0')
      }))
    }
  } catch (err) {
    console.error("fetchPartners failed", err)
  }
  return FALLBACK_STORE.partners
}

export async function createPartner(data: { name: string; mobileNumber?: string; profitSharePercentage?: number; openingBalance?: number; notes?: string }): Promise<PartnerAccount | null> {
  try {
    const payload = {
      name: data.name,
      mobile_number: data.mobileNumber,
      profit_share_percentage: data.profitSharePercentage,
      opening_balance: data.openingBalance,
      notes: data.notes
    }
    const res = await apiFetch(`${API_BASE}/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      const p = body.data
      return {
        id: String(p.id),
        name: p.name,
        mobileNumber: p.mobile_number,
        profitSharePercentage: parseFloat(p.profit_share_percentage || '50'),
        openingBalance: parseFloat(p.opening_balance || '0'),
        currentBalance: parseFloat(p.current_balance || '0'),
        totalInvestment: 0,
        totalWithdrawal: 0,
        additionalContributions: 0,
        adjustments: 0,
        status: p.status || "Active",
        notes: p.notes
      }
    }
  } catch (err) {
    console.error("createPartner failed", err)
  }
  return null
}

export async function createPartnerTransaction(data: {
  partnerId: string
  transactionDate: string
  transactionType: string
  amount: number
  paymentMethod?: string
  notes?: string
  syncCashbook?: boolean
}): Promise<any> {
  try {
    const payload = {
      partner_id: parseInt(data.partnerId, 10),
      transaction_date: data.transactionDate,
      transaction_type: data.transactionType,
      amount: data.amount,
      payment_method: data.paymentMethod || 'Cash',
      notes: data.notes,
      sync_cashbook: data.syncCashbook !== false
    }
    const res = await apiFetch(`${API_BASE}/partners/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    return body.data || null
  } catch (err) {
    console.error("createPartnerTransaction failed", err)
    return null
  }
}

export async function fetchPartnerSummary(): Promise<PartnerAccount[]> {
  try {
    const res = await apiFetch(`${API_BASE}/partners/summary`)
    const body = await res.json()
    if (body.success && body.data) {
      if (Array.isArray(body.data.partners)) {
        return body.data.partners.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          mobileNumber: p.mobile_number,
          profitSharePercentage: parseFloat(p.profit_share_percentage || '50'),
          openingBalance: parseFloat(p.opening_balance || '0'),
          currentBalance: parseFloat(p.equity_balance ?? p.current_balance ?? '0'),
          totalInvestment: parseFloat(p.total_invested || '0'),
          totalWithdrawal: parseFloat(p.total_drawings || '0'),
          additionalContributions: 0,
          adjustments: 0,
          status: p.status || "Active",
          notes: p.notes,
          cashInHandled: parseFloat(p.cash_in_handled || '0'),
          cashOutHandled: parseFloat(p.cash_out_handled || '0'),
          netCashHandled: parseFloat(p.net_cash_handled || '0')
        }))
      }
    }
  } catch (err) {
    console.error("fetchPartnerSummary failed", err)
  }
  return fetchPartners()
}

export async function fetchPartnerEquityTransactions(partnerId?: string): Promise<PartnerTransaction[]> {
  try {
    const url = partnerId
      ? `${API_BASE}/partners/transactions?type=equity&partner_id=${encodeURIComponent(partnerId)}`
      : `${API_BASE}/partners/transactions?type=equity`
    const res = await apiFetch(url)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((pt: any) => ({
        id: String(pt.id),
        partnerId: String(pt.partner_id),
        partnerName: pt.partner_name || "Partner",
        type: pt.transaction_type,
        date: pt.transaction_date,
        amount: parseFloat(pt.amount || "0"),
        paymentMethod: pt.payment_method || "Cash",
        notes: pt.notes || ""
      }))
    }
  } catch (err) {
    console.error("fetchPartnerEquityTransactions failed", err)
  }
  return []
}

export async function updatePartner(partnerId: string, data: { name?: string; mobileNumber?: string; profitSharePercentage?: number; openingBalance?: number; status?: string; notes?: string }): Promise<PartnerAccount | null> {
  try {
    const payload: any = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.mobileNumber !== undefined) payload.mobile_number = data.mobileNumber
    if (data.profitSharePercentage !== undefined) payload.profit_share_percentage = data.profitSharePercentage
    if (data.openingBalance !== undefined) payload.opening_balance = data.openingBalance
    if (data.status !== undefined) payload.status = data.status
    if (data.notes !== undefined) payload.notes = data.notes

    const res = await apiFetch(`${API_BASE}/partners/${partnerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await res.json()
    if (body.success && body.data) {
      const p = body.data
      return {
        id: String(p.id),
        name: p.name,
        mobileNumber: p.mobile_number,
        profitSharePercentage: parseFloat(p.profit_share_percentage || '50'),
        openingBalance: parseFloat(p.opening_balance || '0'),
        currentBalance: parseFloat(p.equity_balance ?? p.current_balance ?? '0'),
        totalInvestment: parseFloat(p.total_invested || '0'),
        totalWithdrawal: parseFloat(p.total_drawings || '0'),
        additionalContributions: 0,
        adjustments: 0,
        status: p.status || "Active",
        notes: p.notes,
        cashInHandled: parseFloat(p.cash_in_handled || '0'),
        cashOutHandled: parseFloat(p.cash_out_handled || '0'),
        netCashHandled: parseFloat(p.net_cash_handled || '0')
      }
    }
  } catch (err) {
    console.error("updatePartner failed", err)
  }
  return null
}

export async function fetchPartnerTransactions(partnerName?: string): Promise<PartnerTransaction[]> {
  try {
    const url = partnerName 
      ? `${API_BASE}/partners/${(partnerName || "").toLowerCase()}` 
      : `${API_BASE}/partners/all`
    const res = await apiFetch(url)
    const body = await res.json()
    if (body.success && body.data) {
      return body.data.map((c: any) => {
        const handledByVal = c["Handled By"] || c.handled_by || c.partner_name || "";
        const incomeVal = parseFloat(c.Income || c.income_amount || 0);
        const outVal = parseFloat(c.Out || c.out_amount || 0);
        return {
          id: String(c.id),
          partnerId: String(c.partner_id || (handledByVal === "Rajubhai" ? "1" : "2")),
          partnerName: handledByVal || "Unknown",
          type: incomeVal > 0 ? ("Capital Investment" as const) : ("Drawing (Personal Withdrawal)" as const),
          date: c.Date || c.transaction_date || "",
          amount: incomeVal > 0 ? incomeVal : outVal,
          notes: c.Notes || c.notes || ""
        };
      })
    }
  } catch (err) {
    console.error("fetchPartnerTransactions failed", err)
  }
  return FALLBACK_STORE.partnerTransactions
}

// Aggregated fallback function for components utilizing the full store
// In-flight request deduplication and caching for getStoredData
let inFlightStoredDataPromise: Promise<typeof FALLBACK_STORE> | null = null
let lastStoredDataFetchTime = 0
const STORED_DATA_TTL_MS = 1000

export async function getStoredData(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && inFlightStoredDataPromise) {
    return inFlightStoredDataPromise
  }
  if (!forceRefresh && lastStoredDataFetchTime > 0 && now - lastStoredDataFetchTime < STORED_DATA_TTL_MS) {
    return FALLBACK_STORE
  }

  inFlightStoredDataPromise = (async () => {
    try {
  const [
    employees,
    transactions,
    salaryRecords,
    seths,
    fabricReceives,
    cuttings,
    expenses,
    incomes,
    cashBook,
    partners,
    partnerTransactions
  ] = await Promise.all([
    fetchEmployees(),
    fetchUpads(),
    fetchSalaries(),
    fetchSeths(),
    fetchFabricReceives(),
    fetchCuttings(),
    fetchExpenses(),
    fetchIncomes(),
    fetchCashBook(),
    fetchPartnerSummary(),
    fetchPartnerTransactions()
  ])

  // Calculate dynamic properties
  const updatedEmployees = employees.map((emp) => {
    const empUpads = transactions.filter(t => t.employeeId === emp.id && t.type === "upad")
    const totalUpad = empUpads.reduce((sum, t) => sum + t.amount, 0)

    const empSalaries = salaryRecords.filter(s => s.employeeId === emp.id)
    const latestSalary = empSalaries.length > 0 ? empSalaries[0].salaryAmount : 0

    return {
      ...emp,
      upad: totalUpad,
      salary: latestSalary
    }
  })

  const updatedSeths = seths.map((seth) => {
    const sethRolls = fabricReceives.filter(r => r.sethId === seth.id)
    const totalFabric = sethRolls.reduce((sum, r) => sum + r.receivedQty, 0)
    const totalRolls = sethRolls.length

    const rollIds = sethRolls.map(r => r.id)
    const sethCuttings = cuttings.filter(c => rollIds.includes(c.rollId))
    const totalCuttingPieces = sethCuttings.reduce((sum, c) => sum + c.pieces, 0)
    const totalCuttingLots = sethCuttings.length

    return {
      ...seth,
      totalFabric,
      totalRolls,
      totalCuttingPieces,
      totalCuttingLots
    }
  })

  const finishedGoods = await fetchFinishedGoods()

  // Dynamically compute seth sub-histories for Seth details views
  const fabricHistories: FabricHistory[] = fabricReceives.map(r => ({
    id: `fh-${r.id}`,
    sethId: r.sethId,
    date: r.date,
    rollNo: r.rollNo,
    meters: r.receivedQty,
    type: r.fabricType
  }))

  const rollTrackings: RollTracking[] = fabricReceives.map(r => ({
    id: `rt-${r.id}`,
    sethId: r.sethId,
    rollNo: r.rollNo,
    receivedQty: r.receivedQty,
    usedQty: r.usedQty,
    remainingQty: r.remainingQty,
    status: (r.remainingQty <= 0 ? "Empty" : r.usedQty > 0 ? "Partial" : "Full") as any
  }))

  const productionHistories: ProductionHistory[] = cuttings.map(c => {
    const roll = fabricReceives.find(r => r.id === c.rollId)
    return {
      id: `ph-${c.id}`,
      sethId: roll?.sethId || "",
      lotNo: c.lotNo,
      cuttingDate: c.date,
      piecesGenerated: c.pieces,
      metersUsed: c.meterUsed
    }
  })

  const paymentHistories: PaymentHistory[] = cashBook
    .filter(cb => cb.type === "Money In" && seths.some(s => s.name.toLowerCase() === (cb.partyName || "").toLowerCase()))
    .map(cb => {
      const seth = seths.find(s => s.name.toLowerCase() === (cb.partyName || "").toLowerCase())
      return {
        id: `pay-${cb.id}`,
        sethId: seth?.id || "",
        date: cb.date,
        amount: cb.amount,
        remarks: cb.remarks || cb.category || "Client Stitching Payment"
      }
    })

  FALLBACK_STORE = {
    ...FALLBACK_STORE,
    employees: updatedEmployees,
    transactions,
    salaryRecords,
    seths: updatedSeths,
    fabricReceives,
    fabricHistories,
    rollTrackings,
    productionHistories,
    paymentHistories,
    cuttings,
    expenses,
    incomes,
    cashBook,
    partners,
    partnerTransactions,
    finishedGoods
  }

  lastStoredDataFetchTime = Date.now()
  return FALLBACK_STORE
    } finally {
      inFlightStoredDataPromise = null
    }
  })()

  return inFlightStoredDataPromise
}



export function getRecentMonthsOptions(count = 6) {
  const months = [];
  const date = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  for (let i = 0; i < count; i++) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const value = String(m + 1).padStart(2, '0');
    const label = `${monthNames[m]} ${y}`;
    const key = `${y}-${value}`;
    months.push({ value, label, key, year: String(y), monthName: monthNames[m] });
    date.setMonth(m - 1);
  }
  return months;
}
