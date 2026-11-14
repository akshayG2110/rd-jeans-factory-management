import { getMongoDb, getNextSequence } from '../mongodb'
import { CashBookService } from './cashbook'
import { EmployeeService } from './employees'

export interface SalaryRecord {
  id: number
  employee_id: number
  salary_month: number
  salary_year: number
  salary_amount: number | string
  total_upad_deducted: number | string
  net_payable: number | string
  paid_amount: number | string
  remaining_amount: number | string
  payment_method: string
  notes?: string | null
  handled_by: string
  payment_date: string
  created_at: string
  updated_at: string
  employee_name?: string
  settled_upads?: any[]
}

export class SalaryService {
  static async getAll(filters: {
    employee_id?: number
    salary_month?: number
    salary_year?: number
    payment_method?: string
    handled_by?: string
    date_from?: string
    date_to?: string
  }) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.employee_id) queryFilter.employee_id = Number(filters.employee_id)
    if (filters.salary_month) queryFilter.salary_month = Number(filters.salary_month)
    if (filters.salary_year) queryFilter.salary_year = Number(filters.salary_year)
    if (filters.payment_method) queryFilter.payment_method = filters.payment_method
    if (filters.handled_by) queryFilter.handled_by = filters.handled_by

    if (filters.date_from || filters.date_to) {
      queryFilter.payment_date = {}
      if (filters.date_from) queryFilter.payment_date.$gte = filters.date_from
      if (filters.date_to) queryFilter.payment_date.$lte = filters.date_to
    }

    const salaries = await db
      .collection('salaries')
      .find(queryFilter)
      .sort({ payment_date: -1, id: -1 })
      .toArray()

    const employees = await db.collection('employees').find({}).toArray()
    const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

    return salaries.map(s => {
      const { _id, ...rest } = s
      return {
        ...rest,
        employee_name: empMap.get(s.employee_id) || ''
      }
    })
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const salary = await db.collection('salaries').findOne({ id: Number(id) })
    if (!salary) return null

    const emp = await db.collection('employees').findOne({ id: salary.employee_id })
    const settledUpads = await db
      .collection('upad_records')
      .find({ settled_in_salary_id: Number(id) })
      .sort({ date: 1, id: 1 })
      .toArray()

    const { _id, ...rest } = salary
    return {
      ...rest,
      employee_name: emp?.employee_name || '',
      employee_role: emp?.role || '',
      settled_upads: settledUpads.map(({ _id, ...u }) => u)
    }
  }

  static async create(data: {
    employee_id: number
    salary_month: number
    salary_year: number
    salary_amount: number
    paid_amount: number
    payment_method: string
    notes?: string | null
    handled_by: string
    payment_date: string
    deduct_upad?: boolean
    upad_ids?: number[]
  }) {
    const db = await getMongoDb()
    const numEmpId = Number(data.employee_id)
    const emp = await db.collection('employees').findOne({ id: numEmpId })
    if (!emp) {
      throw new Error(`Employee with ID ${numEmpId} does not exist.`)
    }

    // 1. Resolve pending Upad advances to deduct
    let upadsToSettle: any[] = []
    if (data.deduct_upad !== false) {
      if (data.upad_ids && data.upad_ids.length > 0) {
        const numUpadIds = data.upad_ids.map(Number)
        upadsToSettle = await db
          .collection('upad_records')
          .find({ id: { $in: numUpadIds }, employee_id: numEmpId, status: 'Pending' })
          .toArray()
      } else {
        upadsToSettle = await db
          .collection('upad_records')
          .find({ employee_id: numEmpId, status: 'Pending', date: { $lte: data.payment_date } })
          .sort({ date: 1, id: 1 })
          .toArray()
      }
    }

    const totalUpadDeducted = upadsToSettle.reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
    const netPayable = Math.max(0, Number(data.salary_amount) - totalUpadDeducted)
    const remainingAmount = Math.max(0, netPayable - Number(data.paid_amount))

    const id = await getNextSequence('salaries')
    const now = new Date().toISOString()
    const salary = {
      id,
      employee_id: numEmpId,
      salary_month: Number(data.salary_month),
      salary_year: Number(data.salary_year),
      salary_amount: Number(data.salary_amount),
      total_upad_deducted: totalUpadDeducted,
      net_payable: netPayable,
      paid_amount: Number(data.paid_amount),
      remaining_amount: remainingAmount,
      payment_method: data.payment_method,
      notes: data.notes || null,
      handled_by: data.handled_by,
      payment_date: data.payment_date,
      created_at: now,
      updated_at: now
    }

    await db.collection('salaries').insertOne(salary)

    // Mark upads as settled
    if (upadsToSettle.length > 0) {
      const upadIds = upadsToSettle.map(u => u.id)
      await db.collection('upad_records').updateMany(
        { id: { $in: upadIds } },
        {
          $set: {
            status: 'Settled',
            settled_in_salary_id: salary.id,
            settled_at: now,
            updated_at: now
          }
        }
      )
    }

    // Cashbook transaction
    if (Number(data.paid_amount) > 0) {
      await CashBookService.logTransaction(
        salary.payment_date,
        'Salary',
        emp.employee_name,
        salary.payment_method,
        0,
        Number(salary.paid_amount),
        salary.handled_by,
        'Salary',
        salary.id,
        salary.notes,
        undefined,
        { salary_id: salary.id }
      )
    }

    const { _id, ...rest } = salary as any
    return {
      ...rest,
      employee_name: emp.employee_name,
      settled_upad_ids: upadsToSettle.map(u => u.id),
      total_upad_deducted: totalUpadDeducted,
      net_payable: netPayable
    }
  }

  static async update(
    id: number,
    data: Partial<{
      employee_id: number
      salary_month: number
      salary_year: number
      salary_amount: number
      paid_amount: number
      payment_method: string
      notes: string | null
      handled_by: string
      payment_date: string
    }>
  ) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('salaries').findOne({ id: numId })
    if (!existing) return null

    const employeeId = data.employee_id !== undefined ? Number(data.employee_id) : existing.employee_id
    const emp = await db.collection('employees').findOne({ id: employeeId })
    if (!emp) {
      throw new Error(`Employee with ID ${employeeId} does not exist.`)
    }

    const salary_month = data.salary_month !== undefined ? Number(data.salary_month) : existing.salary_month
    const salary_year = data.salary_year !== undefined ? Number(data.salary_year) : existing.salary_year
    const salary_amount = data.salary_amount !== undefined ? Number(data.salary_amount) : Number(existing.salary_amount)
    const total_upad_deducted = Number(existing.total_upad_deducted || 0)
    const net_payable = Math.max(0, salary_amount - total_upad_deducted)
    const paid_amount = data.paid_amount !== undefined ? Number(data.paid_amount) : Number(existing.paid_amount)
    const remaining_amount = Math.max(0, net_payable - paid_amount)

    const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
    const notes = data.notes !== undefined ? data.notes : existing.notes
    const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
    const payment_date = data.payment_date !== undefined ? data.payment_date : existing.payment_date

    await db.collection('salaries').updateOne(
      { id: numId },
      {
        $set: {
          employee_id: employeeId,
          salary_month,
          salary_year,
          salary_amount,
          total_upad_deducted,
          net_payable,
          paid_amount,
          remaining_amount,
          payment_method,
          notes,
          handled_by,
          payment_date,
          updated_at: new Date().toISOString()
        }
      }
    )

    if (paid_amount > 0) {
      const cashbookCheck = await db.collection('cash_book_ledger').findOne({
        reference_module: { $regex: '^salary$', $options: 'i' },
        reference_id: numId
      })
      if (cashbookCheck) {
        await CashBookService.updateByReference('Salary', numId, {
          name: emp.employee_name,
          amount: paid_amount,
          paymentMethod: payment_method,
          handledBy: handled_by,
          transactionDate: payment_date,
          notes,
          isIncome: false
        })
      } else {
        await CashBookService.logTransaction(
          payment_date,
          'Salary',
          emp.employee_name,
          payment_method,
          0,
          paid_amount,
          handled_by,
          'Salary',
          numId,
          notes,
          undefined,
          { salary_id: numId }
        )
      }
    } else {
      await CashBookService.deleteByReference('Salary', numId)
    }

    const updated = await db.collection('salaries').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return { ...rest, employee_name: emp.employee_name }
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('salaries').findOne({ id: numId })
    if (!existing) return null

    // Automatically revert all linked Upad advances back to 'Pending'
    await db.collection('upad_records').updateMany(
      { settled_in_salary_id: numId },
      {
        $set: {
          status: 'Pending',
          settled_in_salary_id: null,
          settled_at: null,
          updated_at: new Date().toISOString()
        }
      }
    )

    await db.collection('salaries').deleteOne({ id: numId })
    await CashBookService.deleteByReference('Salary', numId)

    const { _id, ...rest } = existing
    return rest
  }

  static async getEmployeeSummary(employeeId: number) {
    const db = await getMongoDb()
    const numEmpId = Number(employeeId)
    const emp = await EmployeeService.getById(numEmpId)
    if (!emp) throw new Error(`Employee with ID ${numEmpId} does not exist.`)

    const salaries = await db
      .collection('salaries')
      .find({ employee_id: numEmpId })
      .sort({ salary_year: -1, salary_month: -1, payment_date: -1 })
      .toArray()

    let totalSalary = 0
    let totalPaid = 0
    let totalRemaining = 0

    for (const s of salaries) {
      totalSalary += Number(s.salary_amount) || 0
      totalPaid += Number(s.paid_amount) || 0
      totalRemaining += Number(s.remaining_amount) || 0
    }

    return {
      employee_id: emp.id,
      employee_name: emp.employee_name,
      total_salary: totalSalary,
      total_paid: totalPaid,
      total_remaining: totalRemaining,
      salary_history: salaries.map(({ _id, ...rest }) => rest)
    }
  }
}
