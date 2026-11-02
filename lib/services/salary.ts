import { query, getClient } from '../db'
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
    let sql = `
      SELECT s.*, e.employee_name 
      FROM salaries s
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.employee_id) {
      params.push(filters.employee_id)
      sql += ` AND s.employee_id = $${params.length}`
    }
    if (filters.salary_month) {
      params.push(filters.salary_month)
      sql += ` AND s.salary_month = $${params.length}`
    }
    if (filters.salary_year) {
      params.push(filters.salary_year)
      sql += ` AND s.salary_year = $${params.length}`
    }
    if (filters.payment_method) {
      params.push(filters.payment_method)
      sql += ` AND s.payment_method = $${params.length}`
    }
    if (filters.handled_by) {
      params.push(filters.handled_by)
      sql += ` AND s.handled_by = $${params.length}`
    }
    if (filters.date_from) {
      params.push(filters.date_from)
      sql += ` AND s.payment_date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND s.payment_date <= $${params.length}`
    }

    sql += ' ORDER BY s.payment_date DESC, s.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query(
      `SELECT s.*, e.employee_name, e.role as employee_role
       FROM salaries s
       LEFT JOIN employees e ON s.employee_id = e.id
       WHERE s.id = $1`,
      [id]
    )
    if (!res.rows[0]) return null
    const salary = res.rows[0]

    // Fetch settled upad advances physically linked to this salary
    const upadsRes = await query(
      `SELECT id, date, amount, payment_method, notes, handled_by, settled_at
       FROM upad_records
       WHERE settled_in_salary_id = $1
       ORDER BY date ASC, id ASC`,
      [id]
    )
    salary.settled_upads = upadsRes.rows
    return salary
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const empRes = await client.query('SELECT employee_name FROM employees WHERE id = $1', [data.employee_id])
      if (empRes.rows.length === 0) {
        throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
      }
      const employeeName = empRes.rows[0].employee_name

      // 1. Resolve pending Upad advances to deduct
      let upadsToSettle: Array<{ id: number; amount: string | number }> = []
      if (data.deduct_upad !== false) {
        if (data.upad_ids && data.upad_ids.length > 0) {
          const upadQ = await client.query(
            `SELECT id, amount FROM upad_records 
             WHERE id = ANY($1::int[]) AND employee_id = $2 AND status = 'Pending'`,
            [data.upad_ids, data.employee_id]
          )
          upadsToSettle = upadQ.rows
        } else {
          // Auto-deduct all pending upads for this worker up to the salary payment date (or month end)
          const upadQ = await client.query(
            `SELECT id, amount FROM upad_records 
             WHERE employee_id = $1 AND status = 'Pending' AND date <= $2
             ORDER BY date ASC, id ASC`,
            [data.employee_id, data.payment_date]
          )
          upadsToSettle = upadQ.rows
        }
      }

      // Calculate total advance deduction
      const totalUpadDeducted = upadsToSettle.reduce(
        (sum, u) => sum + parseFloat(String(u.amount || '0')),
        0
      )

      // Calculate net payable and remaining unpaid balance
      const netPayable = Math.max(0, data.salary_amount - totalUpadDeducted)
      const remainingAmount = Math.max(0, netPayable - data.paid_amount)

      // 2. Insert salary settlement record
      const salRes = await client.query(
        `INSERT INTO salaries 
         (employee_id, salary_month, salary_year, salary_amount, total_upad_deducted, net_payable, paid_amount, remaining_amount, payment_method, notes, handled_by, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.employee_id,
          data.salary_month,
          data.salary_year,
          data.salary_amount,
          totalUpadDeducted,
          netPayable,
          data.paid_amount,
          remainingAmount,
          data.payment_method,
          data.notes || null,
          data.handled_by,
          data.payment_date
        ]
      )
      const salary = salRes.rows[0]

      // 3. Physically link and mark Upad advances as 'Settled'
      if (upadsToSettle.length > 0) {
        const upadIds = upadsToSettle.map(u => u.id)
        await client.query(
          `UPDATE upad_records
           SET status = 'Settled', settled_in_salary_id = $1, settled_at = NOW(), updated_at = NOW()
           WHERE id = ANY($2::int[])`,
          [salary.id, upadIds]
        )
      }

      // 4. Dual-entry log into CashBook if cash was disbursed
      if (data.paid_amount > 0) {
        await CashBookService.logTransaction(
          salary.payment_date,
          'Salary',
          employeeName,
          salary.payment_method,
          0,
          parseFloat(salary.paid_amount),
          salary.handled_by,
          'Salary',
          salary.id,
          salary.notes,
          client,
          { salary_id: salary.id }
        )
      }

      await client.query('COMMIT')
      return { 
        ...salary, 
        employee_name: employeeName, 
        settled_upad_ids: upadsToSettle.map(u => u.id),
        total_upad_deducted: totalUpadDeducted,
        net_payable: netPayable
      }
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM salaries WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      const employeeId = data.employee_id !== undefined ? data.employee_id : existing.employee_id
      const empRes = await client.query('SELECT employee_name FROM employees WHERE id = $1', [employeeId])
      if (empRes.rows.length === 0) {
        throw new Error(`Employee with ID ${employeeId} does not exist.`)
      }
      const employeeName = empRes.rows[0].employee_name

      const salary_month = data.salary_month !== undefined ? data.salary_month : existing.salary_month
      const salary_year = data.salary_year !== undefined ? data.salary_year : existing.salary_year
      const salary_amount = data.salary_amount !== undefined ? data.salary_amount : parseFloat(existing.salary_amount)
      const total_upad_deducted = parseFloat(existing.total_upad_deducted || '0.00')
      const net_payable = Math.max(0, salary_amount - total_upad_deducted)
      const paid_amount = data.paid_amount !== undefined ? data.paid_amount : parseFloat(existing.paid_amount)
      const remaining_amount = Math.max(0, net_payable - paid_amount)

      const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
      const notes = data.notes !== undefined ? data.notes : existing.notes
      const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
      const payment_date = data.payment_date !== undefined ? data.payment_date : existing.payment_date

      const updateRes = await client.query(
        `UPDATE salaries
         SET employee_id = $1, salary_month = $2, salary_year = $3, salary_amount = $4, 
             total_upad_deducted = $5, net_payable = $6, paid_amount = $7, remaining_amount = $8, 
             payment_method = $9, notes = $10, handled_by = $11, payment_date = $12, updated_at = NOW()
         WHERE id = $13
         RETURNING *`,
        [
          employeeId,
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
          id
        ]
      )
      const updated = updateRes.rows[0]

      if (paid_amount > 0) {
        const cashbookCheck = await client.query(
          'SELECT id FROM cash_book_ledger WHERE reference_module ILIKE $1 AND reference_id = $2',
          ['Salary', id]
        )
        if (cashbookCheck.rows.length > 0) {
          await CashBookService.updateByReference(
            'Salary',
            id,
            {
              name: employeeName,
              amount: paid_amount,
              paymentMethod: payment_method,
              handledBy: handled_by,
              transactionDate: payment_date,
              notes,
              isIncome: false
            },
            client
          )
        } else {
          await CashBookService.logTransaction(
            payment_date,
            'Salary',
            employeeName,
            payment_method,
            0,
            paid_amount,
            handled_by,
            'Salary',
            id,
            notes,
            client,
            { salary_id: id }
          )
        }
      } else {
        await CashBookService.deleteByReference('Salary', id, client)
      }

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

      const existingRes = await client.query('SELECT * FROM salaries WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      // Automatically revert all linked Upad advances back to 'Pending'
      await client.query(
        `UPDATE upad_records 
         SET status = 'Pending', settled_in_salary_id = NULL, settled_at = NULL, updated_at = NOW()
         WHERE settled_in_salary_id = $1`,
        [id]
      )

      await client.query('DELETE FROM salaries WHERE id = $1', [id])
      await CashBookService.deleteByReference('Salary', id, client)

      await client.query('COMMIT')
      return existing
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getEmployeeSummary(employeeId: number) {
    const emp = await EmployeeService.getById(employeeId)
    if (!emp) throw new Error(`Employee with ID ${employeeId} does not exist.`)

    const totalSalaryRes = await query(
      'SELECT COALESCE(SUM(salary_amount), 0) as total FROM salaries WHERE employee_id = $1',
      [employeeId]
    )
    const totalPaidRes = await query(
      'SELECT COALESCE(SUM(paid_amount), 0) as total FROM salaries WHERE employee_id = $1',
      [employeeId]
    )
    const totalRemainingRes = await query(
      'SELECT COALESCE(SUM(remaining_amount), 0) as total FROM salaries WHERE employee_id = $1',
      [employeeId]
    )
    const historyRes = await query(
      'SELECT * FROM salaries WHERE employee_id = $1 ORDER BY salary_year DESC, salary_month DESC, payment_date DESC',
      [employeeId]
    )

    return {
      employee_id: emp.id,
      employee_name: emp.employee_name,
      total_salary: parseFloat(totalSalaryRes.rows[0]?.total || '0.00'),
      total_paid: parseFloat(totalPaidRes.rows[0]?.total || '0.00'),
      total_remaining: parseFloat(totalRemainingRes.rows[0]?.total || '0.00'),
      salary_history: historyRes.rows
    }
  }
}
