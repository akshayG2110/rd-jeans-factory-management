import { query, getClient } from '../db'
import { CashBookService } from './cashbook'

export interface Seth {
  id: number
  seth_name: string
  mobile_number?: string | null
  address?: string | null
  notes?: string | null
  status: string
  created_at: string
  updated_at: string
}

export class SethService {
  static async getAll(search?: string, status?: string) {
    let sql = 'SELECT * FROM seths WHERE 1=1'
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      sql += ` AND seth_name ILIKE $${params.length}`
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
    const res = await query('SELECT * FROM seths WHERE id = $1', [id])
    return res.rows[0] || null
  }

  static async create(data: { seth_name: string; mobile_number?: string | null; address?: string | null; notes?: string | null; status?: string }) {
    const status = data.status || 'Active'
    const res = await query(
      `INSERT INTO seths (seth_name, mobile_number, address, notes, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.seth_name, data.mobile_number || null, data.address || null, data.notes || null, status]
    )
    return res.rows[0]
  }

  static async update(id: number, data: Partial<{ seth_name: string; mobile_number: string | null; address: string | null; notes: string | null; status: string }>) {
    const existing = await this.getById(id)
    if (!existing) return null

    const seth_name = data.seth_name !== undefined ? data.seth_name : existing.seth_name
    const mobile_number = data.mobile_number !== undefined ? data.mobile_number : existing.mobile_number
    const address = data.address !== undefined ? data.address : existing.address
    const notes = data.notes !== undefined ? data.notes : existing.notes
    const status = data.status !== undefined ? data.status : existing.status

    const res = await query(
      `UPDATE seths
       SET seth_name = $1, mobile_number = $2, address = $3, notes = $4, status = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [seth_name, mobile_number, address, notes, status, id]
    )
    return res.rows[0]
  }

  static async delete(id: number) {
    const res = await query('DELETE FROM seths WHERE id = $1 RETURNING *', [id])
    return res.rows[0] || null
  }

  // Seth Payment Operations
  static async addPayment(sethId: number, data: {
    payment_date: string
    amount: number
    payment_method: string
    notes?: string | null
    handled_by: string
  }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const sethRes = await client.query('SELECT seth_name FROM seths WHERE id = $1', [sethId])
      if (sethRes.rows.length === 0) {
        throw new Error(`Seth client with ID ${sethId} does not exist.`)
      }
      const sethName = sethRes.rows[0].seth_name

      const paymentRes = await client.query(
        `INSERT INTO seth_payments (seth_id, payment_date, amount, payment_method, notes, handled_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [sethId, data.payment_date, data.amount, data.payment_method, data.notes || null, data.handled_by]
      )
      const payment = paymentRes.rows[0]

      await CashBookService.logTransaction(
        payment.payment_date,
        'Seth Payment',
        sethName,
        payment.payment_method,
        parseFloat(payment.amount),
        0,
        payment.handled_by,
        'Seth Payment',
        payment.id,
        payment.notes,
        client,
        { seth_payment_id: payment.id }
      )

      await client.query('COMMIT')
      return payment
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getPayments(sethId: number) {
    const res = await query(
      'SELECT * FROM seth_payments WHERE seth_id = $1 ORDER BY payment_date DESC, id DESC',
      [sethId]
    )
    return res.rows
  }
}
