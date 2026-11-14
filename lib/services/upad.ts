import { getMongoDb, getNextSequence } from '../mongodb'
import { CashBookService } from './cashbook'
import { EmployeeService } from './employees'

export interface UpadRecord {
  id: number
  employee_id: number
  date: string
  amount: number | string
  payment_method: string
  notes?: string | null
  handled_by: string
  status: 'Pending' | 'Settled' | 'Cancelled'
  settled_in_salary_id?: number | null
  settled_at?: string | null
  created_at: string
  updated_at: string
  employee_name?: string
  settled_in_salary?: {
    id: number
    salary_month: number
    salary_year: number
    payment_date: string
  }
}

export class UpadService {
  static async getAll(filters: {
    employee_id?: number
    date_from?: string
    date_to?: string
    payment_method?: string
    handled_by?: string
    status?: string
    settled_in_salary_id?: number
  }) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.employee_id) queryFilter.employee_id = Number(filters.employee_id)
    if (filters.payment_method) queryFilter.payment_method = filters.payment_method
    if (filters.handled_by) queryFilter.handled_by = filters.handled_by
    if (filters.status) queryFilter.status = filters.status
    if (filters.settled_in_salary_id) queryFilter.settled_in_salary_id = Number(filters.settled_in_salary_id)

    if (filters.date_from || filters.date_to) {
      queryFilter.date = {}
      if (filters.date_from) queryFilter.date.$gte = filters.date_from
      if (filters.date_to) queryFilter.date.$lte = filters.date_to
    }

    const upads = await db.collection('upad_records').find(queryFilter).sort({ date: -1, id: -1 }).toArray()
    const employees = await db.collection('employees').find({}).toArray()
    const salaries = await db.collection('salaries').find({}).toArray()

    const empMap = new Map(employees.map(e => [e.id, e.employee_name]))
    const salMap = new Map(salaries.map(s => [s.id, s]))

    return upads.map(u => {
      const { _id, ...rest } = u
      const sal = u.settled_in_salary_id ? salMap.get(u.settled_in_salary_id) : null
      return {
        ...rest,
        employee_name: empMap.get(u.employee_id) || '',
        settled_salary_month: sal?.salary_month,
        settled_salary_year: sal?.salary_year,
        settled_salary_payment_date: sal?.payment_date
      }
    })
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const upad = await db.collection('upad_records').findOne({ id: Number(id) })
    if (!upad) return null
    const emp = await db.collection('employees').findOne({ id: upad.employee_id })
    const { _id, ...rest } = upad
    return {
      ...rest,
      employee_name: emp?.employee_name || ''
    }
  }

  static async create(data: {
    employee_id: number
    date: string
    amount: number
    payment_method: string
    notes?: string | null
    handled_by: string
  }) {
    const db = await getMongoDb()
    const numEmpId = Number(data.employee_id)
    const emp = await db.collection('employees').findOne({ id: numEmpId })
    if (!emp) {
      throw new Error(`Employee with ID ${numEmpId} does not exist.`)
    }

    const id = await getNextSequence('upad_records')
    const now = new Date().toISOString()
    const upad = {
      id,
      employee_id: numEmpId,
      date: data.date,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      notes: data.notes || null,
      handled_by: data.handled_by,
      status: 'Pending' as const,
      settled_in_salary_id: null,
      settled_at: null,
      created_at: now,
      updated_at: now
    }

    await db.collection('upad_records').insertOne(upad)

    await CashBookService.logTransaction(
      upad.date,
      'Upad',
      emp.employee_name,
      upad.payment_method,
      0,
      Number(upad.amount),
      upad.handled_by,
      'Upad',
      upad.id,
      upad.notes,
      undefined,
      { upad_id: upad.id }
    )

    const { _id, ...rest } = upad as any
    return { ...rest, employee_name: emp.employee_name }
  }

  static async update(
    id: number,
    data: Partial<{
      employee_id: number
      date: string
      amount: number
      payment_method: string
      notes: string | null
      handled_by: string
    }>
  ) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('upad_records').findOne({ id: numId })
    if (!existing) return null

    const employeeId = data.employee_id !== undefined ? Number(data.employee_id) : existing.employee_id
    const emp = await db.collection('employees').findOne({ id: employeeId })
    if (!emp) {
      throw new Error(`Employee with ID ${employeeId} does not exist.`)
    }

    const upadDate = data.date !== undefined ? data.date : existing.date
    const amount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount)
    const paymentMethod = data.payment_method !== undefined ? data.payment_method : existing.payment_method
    const notes = data.notes !== undefined ? data.notes : existing.notes
    const handledBy = data.handled_by !== undefined ? data.handled_by : existing.handled_by

    await db.collection('upad_records').updateOne(
      { id: numId },
      {
        $set: {
          employee_id: employeeId,
          date: upadDate,
          amount,
          payment_method: paymentMethod,
          notes,
          handled_by: handledBy,
          updated_at: new Date().toISOString()
        }
      }
    )

    await CashBookService.updateByReference(
      'Upad',
      numId,
      {
        name: emp.employee_name,
        amount,
        paymentMethod,
        handledBy,
        transactionDate: upadDate,
        notes,
        isIncome: false
      }
    )

    const updated = await db.collection('upad_records').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return { ...rest, employee_name: emp.employee_name }
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('upad_records').findOne({ id: numId })
    if (!existing) return null

    if (existing.status === 'Settled' && existing.settled_in_salary_id) {
      throw new Error(
        `Cannot delete Upad advance #${id} because it was deducted in Salary settlement #${existing.settled_in_salary_id}. Void or delete the salary settlement first.`
      )
    }

    await db.collection('upad_records').deleteOne({ id: numId })
    await CashBookService.deleteByReference('Upad', numId)

    const { _id, ...rest } = existing
    return rest
  }

  static async getEmployeeSummary(employeeId: number, options?: { month?: number; year?: number }) {
    const db = await getMongoDb()
    const numEmpId = Number(employeeId)
    const emp = await EmployeeService.getById(numEmpId)
    if (!emp) throw new Error(`Employee with ID ${numEmpId} does not exist.`)

    const now = new Date()
    const targetMonth = options?.month ?? (now.getMonth() + 1)
    const targetYear = options?.year ?? now.getFullYear()

    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1
    const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear
    const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const allRecords = await db.collection('upad_records').find({ employee_id: numEmpId }).toArray()

    let totalUpad = 0
    let unsettledUpad = 0
    let settledUpad = 0
    let currentMonthUpad = 0
    let monthPendingUpad = 0

    const unsettledRecords = []

    for (const u of allRecords) {
      const amt = Number(u.amount) || 0
      totalUpad += amt
      if (u.status === 'Pending') {
        unsettledUpad += amt
        unsettledRecords.push(u)
      } else if (u.status === 'Settled') {
        settledUpad += amt
      }

      if (u.date >= startOfMonth && u.date < endOfMonth) {
        currentMonthUpad += amt
        if (u.status === 'Pending') {
          monthPendingUpad += amt
        }
      }
    }

    unsettledRecords.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)

    const history = allRecords
      .map(({ _id, ...rest }) => rest)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)

    return {
      employee_id: emp.id,
      employee_name: emp.employee_name,
      total_upad: totalUpad,
      unsettled_upad: unsettledUpad,
      settled_upad: settledUpad,
      current_month_upad: currentMonthUpad,
      month_pending_upad: monthPendingUpad,
      unsettled_upad_records: unsettledRecords.map(({ _id, ...rest }) => rest),
      upad_history: history
    }
  }
}
