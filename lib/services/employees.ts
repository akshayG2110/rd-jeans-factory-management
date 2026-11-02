import { query } from '../db'

export interface Employee {
  id: number
  employee_name: string
  role: string
  joining_date: string
  status: string
  created_at: string
  updated_at: string
}

export class EmployeeService {
  static async getAll(search?: string, role?: string, status?: string) {
    let sql = 'SELECT * FROM employees WHERE 1=1'
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      sql += ` AND employee_name ILIKE $${params.length}`
    }
    if (role) {
      params.push(role)
      sql += ` AND role = $${params.length}`
    }
    if (status) {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }

    sql += ' ORDER BY id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query('SELECT * FROM employees WHERE id = $1', [id])
    return res.rows[0] || null
  }

  static async create(data: { employee_name: string; role: string; joining_date: string; status?: string }) {
    const status = data.status || 'Active'
    const res = await query(
      `INSERT INTO employees (employee_name, role, joining_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.employee_name, data.role, data.joining_date, status]
    )
    return res.rows[0]
  }

  static async update(id: number, data: Partial<{ employee_name: string; role: string; joining_date: string; status: string }>) {
    const existing = await this.getById(id)
    if (!existing) return null

    const employee_name = data.employee_name !== undefined ? data.employee_name : existing.employee_name
    const role = data.role !== undefined ? data.role : existing.role
    const joining_date = data.joining_date !== undefined ? data.joining_date : existing.joining_date
    const status = data.status !== undefined ? data.status : existing.status

    const res = await query(
      `UPDATE employees
       SET employee_name = $1, role = $2, joining_date = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [employee_name, role, joining_date, status, id]
    )
    return res.rows[0]
  }

  static async delete(id: number) {
    // 1. Block deletion if worker has active/unsettled Upad advances
    const upadCheck = await query(
      "SELECT COUNT(*) as count FROM upad_records WHERE employee_id = $1 AND status != 'Settled'",
      [id]
    )
    if (parseInt(upadCheck.rows[0]?.count || '0', 10) > 0) {
      throw new Error('Cannot delete worker with outstanding (unsettled) Upad advances. Please settle all advances first or mark worker Inactive.')
    }

    // 2. If worker has cutting entries or salary history, soft-delete by setting status = Inactive
    const [cutCheck, salCheck] = await Promise.all([
      query("SELECT COUNT(*) as count FROM cutting_entries WHERE employee_id = $1", [id]),
      query("SELECT COUNT(*) as count FROM salaries WHERE employee_id = $1", [id])
    ])

    const hasHistory = 
      parseInt(cutCheck.rows[0]?.count || '0', 10) > 0 ||
      parseInt(salCheck.rows[0]?.count || '0', 10) > 0

    if (hasHistory) {
      const res = await query(
        "UPDATE employees SET status = 'Inactive', updated_at = NOW() WHERE id = $1 RETURNING *",
        [id]
      )
      return res.rows[0] || null
    }

    // 3. Otherwise safe hard delete
    const res = await query('DELETE FROM employees WHERE id = $1 RETURNING *', [id])
    return res.rows[0] || null
  }
}
