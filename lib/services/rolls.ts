import { query, getClient } from '../db'

export interface Roll {
  id: number
  seth_id: number
  entry_date: string
  roll_number: string
  short_number: string
  fabric_type: string
  received_meter: number | string
  used_meter: number | string
  remaining_meter: number | string
  status: string
  notes?: string | null
  created_at: string
  updated_at: string
  seth_name?: string
}

export class RollService {
  static async getAll(filters: {
    seth_id?: number
    fabric_type?: string
    status?: string
    search?: string
  }) {
    let sql = `
      SELECT r.*, s.seth_name 
      FROM rolls r
      LEFT JOIN seths s ON r.seth_id = s.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.seth_id) {
      params.push(filters.seth_id)
      sql += ` AND r.seth_id = $${params.length}`
    }
    if (filters.fabric_type) {
      params.push(filters.fabric_type)
      sql += ` AND r.fabric_type = $${params.length}`
    }
    if (filters.status) {
      params.push(filters.status)
      sql += ` AND r.status = $${params.length}`
    }
    if (filters.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (r.roll_number ILIKE $${params.length} OR r.short_number ILIKE $${params.length} OR s.seth_name ILIKE $${params.length})`
    }

    sql += ' ORDER BY r.entry_date DESC, r.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query(
      `SELECT r.*, s.seth_name 
       FROM rolls r
       LEFT JOIN seths s ON r.seth_id = s.id
       WHERE r.id = $1`,
      [id]
    )
    return res.rows[0] || null
  }

  static async create(data: {
    seth_id: number
    entry_date: string
    roll_number: string
    short_number: string
    fabric_type: string
    received_meter: number
    notes?: string | null
  }) {
    const sethRes = await query('SELECT seth_name FROM seths WHERE id = $1', [data.seth_id])
    if (sethRes.rows.length === 0) {
      throw new Error(`Seth client with ID ${data.seth_id} does not exist.`)
    }

    const remaining_meter = data.received_meter
    const status = 'Available'

    const res = await query(
      `INSERT INTO rolls (seth_id, entry_date, roll_number, short_number, fabric_type, received_meter, used_meter, remaining_meter, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 0.00, $7, $8, $9)
       RETURNING *`,
      [
        data.seth_id,
        data.entry_date,
        data.roll_number,
        data.short_number,
        data.fabric_type,
        data.received_meter,
        remaining_meter,
        status,
        data.notes || null
      ]
    )
    return { ...res.rows[0], seth_name: sethRes.rows[0].seth_name }
  }

  static async update(
    id: number,
    data: Partial<{
      seth_id: number
      entry_date: string
      roll_number: string
      short_number: string
      fabric_type: string
      received_meter: number
      notes: string | null
    }>
  ) {
    const existing = await this.getById(id)
    if (!existing) return null

    const seth_id = data.seth_id !== undefined ? data.seth_id : existing.seth_id
    const sethRes = await query('SELECT seth_name FROM seths WHERE id = $1', [seth_id])
    if (sethRes.rows.length === 0) {
      throw new Error(`Seth client with ID ${seth_id} does not exist.`)
    }

    const entry_date = data.entry_date !== undefined ? data.entry_date : existing.entry_date
    const roll_number = data.roll_number !== undefined ? data.roll_number : existing.roll_number
    const short_number = data.short_number !== undefined ? data.short_number : existing.short_number
    const fabric_type = data.fabric_type !== undefined ? data.fabric_type : existing.fabric_type
    const received_meter = data.received_meter !== undefined ? data.received_meter : parseFloat(existing.received_meter)
    const notes = data.notes !== undefined ? data.notes : existing.notes

    const used_meter = parseFloat(existing.used_meter)
    const remaining_meter = received_meter - used_meter
    let status = 'Available'
    if (remaining_meter <= 0) {
      status = 'Completed'
    } else if (used_meter > 0) {
      status = 'Partially Used'
    }

    const res = await query(
      `UPDATE rolls
       SET seth_id = $1, entry_date = $2, roll_number = $3, short_number = $4, 
           fabric_type = $5, received_meter = $6, remaining_meter = $7, status = $8, notes = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [seth_id, entry_date, roll_number, short_number, fabric_type, received_meter, remaining_meter, status, notes, id]
    )
    return { ...res.rows[0], seth_name: sethRes.rows[0].seth_name }
  }

  static async delete(id: number) {
    const res = await query('DELETE FROM rolls WHERE id = $1 RETURNING *', [id])
    return res.rows[0] || null
  }
}
