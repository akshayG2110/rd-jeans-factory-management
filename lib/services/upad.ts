import { query, getClient } from '../db'
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
    let sql = `
      SELECT u.*, e.employee_name,
             s.salary_month as settled_salary_month, s.salary_year as settled_salary_year, s.payment_date as settled_salary_payment_date
      FROM upad_records u
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN salaries s ON u.settled_in_salary_id = s.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.employee_id) {
      params.push(filters.employee_id)
      sql += ` AND u.employee_id = $${params.length}`
    }
    if (filters.date_from) {
      params.push(filters.date_from)
      sql += ` AND u.date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND u.date <= $${params.length}`
    }
    if (filters.payment_method) {
      params.push(filters.payment_method)
      sql += ` AND u.payment_method = $${params.length}`
    }
    if (filters.handled_by) {
      params.push(filters.handled_by)
      sql += ` AND u.handled_by = $${params.length}`
    }
    if (filters.status) {
      params.push(filters.status)
      sql += ` AND u.status = $${params.length}`
    }
    if (filters.settled_in_salary_id) {
      params.push(filters.settled_in_salary_id)
      sql += ` AND u.settled_in_salary_id = $${params.length}`
    }

    sql += ' ORDER BY u.date DESC, u.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query(
      `SELECT u.*, e.employee_name 
       FROM upad_records u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = $1`,
      [id]
    )
    return res.rows[0] || null
  }

  static async create(data: {
    employee_id: number
    date: string
    amount: number
    payment_method: string
    notes?: string | null
    handled_by: string
  }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const empRes = await client.query('SELECT employee_name FROM employees WHERE id = $1', [data.employee_id])
      if (empRes.rows.length === 0) {
        throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
      }
      const employeeName = empRes.rows[0].employee_name

      const upadRes = await client.query(
        `INSERT INTO upad_records (employee_id, date, amount, payment_method, notes, handled_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.employee_id, data.date, data.amount, data.payment_method, data.notes || null, data.handled_by]
      )
      const upad = upadRes.rows[0]

      await CashBookService.logTransaction(
        upad.date,
        'Upad',
        employeeName,
        upad.payment_method,
        0,
        parseFloat(upad.amount),
        upad.handled_by,
        'Upad',
        upad.id,
        upad.notes,
        client,
        { upad_id: upad.id }
      )

      await client.query('COMMIT')
      return { ...upad, employee_name: employeeName }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM upad_records WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      const employeeId = data.employee_id !== undefined ? data.employee_id : existing.employee_id
      const empRes = await client.query('SELECT employee_name FROM employees WHERE id = $1', [employeeId])
      if (empRes.rows.length === 0) {
        throw new Error(`Employee with ID ${employeeId} does not exist.`)
      }
      const employeeName = empRes.rows[0].employee_name

      const upadDate = data.date !== undefined ? data.date : existing.date
      const amount = data.amount !== undefined ? data.amount : parseFloat(existing.amount)
      const paymentMethod = data.payment_method !== undefined ? data.payment_method : existing.payment_method
      const notes = data.notes !== undefined ? data.notes : existing.notes
      const handledBy = data.handled_by !== undefined ? data.handled_by : existing.handled_by

      const updateRes = await client.query(
        `UPDATE upad_records
         SET employee_id = $1, date = $2, amount = $3, payment_method = $4, notes = $5, handled_by = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [employeeId, upadDate, amount, paymentMethod, notes, handledBy, id]
      )
      const updated = updateRes.rows[0]

      await CashBookService.updateByReference(
        'Upad',
        id,
        {
          name: employeeName,
          amount,
          paymentMethod,
          handledBy,
          transactionDate: upadDate,
          notes,
          isIncome: false
        },
        client
      )

      await client.query('COMMIT')
      return { ...updated, employee_name: employeeName }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async delete(id: number) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM upad_records WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      if (existing.status === 'Settled' && existing.settled_in_salary_id) {
        throw new Error(
          `Cannot delete Upad advance #${id} because it was deducted in Salary settlement #${existing.settled_in_salary_id}. Void or delete the salary settlement first.`
        )
      }

      await client.query('DELETE FROM upad_records WHERE id = $1', [id])
      await CashBookService.deleteByReference('Upad', id, client)

      await client.query('COMMIT')
      return existing
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getEmployeeSummary(employeeId: number, options?: { month?: number; year?: number }) {
    const emp = await EmployeeService.getById(employeeId)
    if (!emp) throw new Error(`Employee with ID ${employeeId} does not exist.`)

    const now = new Date()
    const targetMonth = options?.month ?? (now.getMonth() + 1)
    const targetYear = options?.year ?? now.getFullYear()

    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1
    const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear
    const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const totalRes = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM upad_records WHERE employee_id = $1',
      [employeeId]
    )

    const unsettledRes = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM upad_records WHERE employee_id = $1 AND status = 'Pending'",
      [employeeId]
    )

    const settledRes = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM upad_records WHERE employee_id = $1 AND status = 'Settled'",
      [employeeId]
    )

    const monthRes = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM upad_records WHERE employee_id = $1 AND date >= $2 AND date < $3',
      [employeeId, startOfMonth, endOfMonth]
    )

    const pendingForMonthRes = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM upad_records WHERE employee_id = $1 AND status = 'Pending' AND date >= $2 AND date < $3",
      [employeeId, startOfMonth, endOfMonth]
    )

    const unsettledListRes = await query(
      "SELECT * FROM upad_records WHERE employee_id = $1 AND status = 'Pending' ORDER BY date ASC, id ASC",
      [employeeId]
    )

    const historyRes = await query(
      `SELECT u.*, s.salary_month, s.salary_year, s.payment_date as salary_payment_date
       FROM upad_records u
       LEFT JOIN salaries s ON u.settled_in_salary_id = s.id
       WHERE u.employee_id = $1 
       ORDER BY u.date DESC, u.id DESC`,
      [employeeId]
    )

    return {
      employee_id: emp.id,
      employee_name: emp.employee_name,
      total_upad: parseFloat(totalRes.rows[0]?.total || '0.00'),
      unsettled_upad: parseFloat(unsettledRes.rows[0]?.total || '0.00'),
      settled_upad: parseFloat(settledRes.rows[0]?.total || '0.00'),
      current_month_upad: parseFloat(monthRes.rows[0]?.total || '0.00'),
      month_pending_upad: parseFloat(pendingForMonthRes.rows[0]?.total || '0.00'),
      unsettled_upad_records: unsettledListRes.rows,
      upad_history: historyRes.rows
    }
  }
}
