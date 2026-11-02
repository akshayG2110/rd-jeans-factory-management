import { query, getClient } from '../db'

export interface CuttingEntry {
  id: number
  cutting_date: string
  lot_number: string
  roll_id: number
  employee_id?: number | null
  meter_used: number | string
  layer_information?: string | null
  piece_count: number
  size: string
  pana?: number | string | null
  average?: number | string | null
  sort_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  roll_number?: string
  fabric_type?: string
  seth_name?: string
  employee_name?: string | null
  employee_role?: string | null
  finished_goods?: any[]
}

export class CuttingService {
  private static async updateRollMeterAndStatus(client: any, rollId: number) {
    const totalUsedRes = await client.query(
      'SELECT COALESCE(SUM(meter_used), 0) as total FROM cutting_entries WHERE roll_id = $1',
      [rollId]
    )
    const totalUsed = parseFloat(totalUsedRes.rows[0]?.total || '0.00')

    const rollRes = await client.query('SELECT received_meter FROM rolls WHERE id = $1', [rollId])
    if (rollRes.rows.length === 0) return

    const receivedMeter = parseFloat(rollRes.rows[0].received_meter)
    const remainingMeter = receivedMeter - totalUsed

    let status = 'Available'
    if (remainingMeter <= 0) {
      status = 'Completed'
    } else if (totalUsed > 0) {
      status = 'Partially Used'
    }

    await client.query(
      'UPDATE rolls SET used_meter = $1, remaining_meter = $2, status = $3, updated_at = NOW() WHERE id = $4',
      [totalUsed, remainingMeter, status, rollId]
    )
  }

  static async getAll(filters: {
    roll_id?: number
    employee_id?: number
    size?: string
    sort_number?: string
    date_from?: string
    date_to?: string
    search?: string
  }) {
    let sql = `
      SELECT c.*, r.roll_number, r.fabric_type, s.seth_name,
             e.employee_name, e.role as employee_role
      FROM cutting_entries c
      LEFT JOIN rolls r ON c.roll_id = r.id
      LEFT JOIN seths s ON r.seth_id = s.id
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.roll_id) {
      params.push(filters.roll_id)
      sql += ` AND c.roll_id = $${params.length}`
    }
    if (filters.employee_id) {
      params.push(filters.employee_id)
      sql += ` AND c.employee_id = $${params.length}`
    }
    if (filters.size) {
      params.push(filters.size)
      sql += ` AND c.size = $${params.length}`
    }
    if (filters.sort_number) {
      params.push(filters.sort_number)
      sql += ` AND c.sort_number = $${params.length}`
    }
    if (filters.date_from) {
      params.push(filters.date_from)
      sql += ` AND c.cutting_date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND c.cutting_date <= $${params.length}`
    }
    if (filters.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (c.lot_number ILIKE $${params.length} OR r.roll_number ILIKE $${params.length} OR c.sort_number ILIKE $${params.length} OR e.employee_name ILIKE $${params.length})`
    }

    sql += ' ORDER BY c.cutting_date DESC, c.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query(
      `SELECT c.*, r.roll_number, r.fabric_type, s.seth_name,
              e.employee_name, e.role as employee_role
       FROM cutting_entries c
       LEFT JOIN rolls r ON c.roll_id = r.id
       LEFT JOIN seths s ON r.seth_id = s.id
       LEFT JOIN employees e ON c.employee_id = e.id
       WHERE c.id = $1`,
      [id]
    )
    if (!res.rows[0]) return null

    const fgRes = await query(
      `SELECT * FROM finished_goods WHERE cutting_id = $1 ORDER BY id ASC`,
      [id]
    )
    res.rows[0].finished_goods = fgRes.rows
    return res.rows[0]
  }

  static async getByEmployeeId(employeeId: number) {
    return this.getAll({ employee_id: employeeId })
  }

  static async create(data: {
    cutting_date: string
    lot_number: string
    roll_id: number
    employee_id?: number | null
    meter_used: number
    layer_information?: string | null
    piece_count: number
    size: string
    pana?: number | null
    average?: number | null
    sort_number?: string | null
    notes?: string | null
  }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const rollRes = await client.query('SELECT remaining_meter FROM rolls WHERE id = $1', [data.roll_id])
      if (rollRes.rows.length === 0) {
        throw new Error(`Roll with ID ${data.roll_id} does not exist.`)
      }

      const remainingMeter = parseFloat(rollRes.rows[0].remaining_meter || '0')
      if (data.meter_used > remainingMeter) {
        throw new Error(`Cannot cut ${data.meter_used}m. Roll #${data.roll_id} only has ${remainingMeter}m remaining.`)
      }

      if (data.employee_id) {
        const empRes = await client.query('SELECT id, employee_name FROM employees WHERE id = $1', [data.employee_id])
        if (empRes.rows.length === 0) {
          throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
        }
      }

      const insertRes = await client.query(
        `INSERT INTO cutting_entries 
         (cutting_date, lot_number, roll_id, employee_id, meter_used, layer_information, piece_count, size, pana, average, sort_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.cutting_date,
          data.lot_number,
          data.roll_id,
          data.employee_id || null,
          data.meter_used,
          data.layer_information || null,
          data.piece_count,
          data.size,
          data.pana || null,
          data.average || null,
          data.sort_number || null,
          data.notes || null
        ]
      )
      const rawCutting = insertRes.rows[0]

      // Automatically initialize linked Finished Goods Garment Inventory
      const rollSethRes = await client.query('SELECT seth_id FROM rolls WHERE id = $1', [data.roll_id])
      const sethId = rollSethRes.rows[0]?.seth_id || null

      await client.query(
        `INSERT INTO finished_goods 
         (cutting_id, seth_id, lot_number, item_name, size, total_pieces, finished_pieces, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          rawCutting.id,
          sethId,
          data.lot_number,
          'Denim Jeans',
          data.size,
          data.piece_count,
          data.piece_count,
          'Cut',
          `Initial production yield from Roll #${data.roll_id}`
        ]
      )

      await this.updateRollMeterAndStatus(client, data.roll_id)

      await client.query('COMMIT')
      return await this.getById(rawCutting.id)
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
      cutting_date: string
      lot_number: string
      roll_id: number
      employee_id: number | null
      meter_used: number
      layer_information: string | null
      piece_count: number
      size: string
      pana: number | null
      average: number | null
      sort_number: string | null
      notes: string | null
    }>
  ) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM cutting_entries WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      const oldRollId = existing.roll_id

      if (data.employee_id !== undefined && data.employee_id !== null) {
        const empRes = await client.query('SELECT id FROM employees WHERE id = $1', [data.employee_id])
        if (empRes.rows.length === 0) {
          throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
        }
      }

      const cutting_date = data.cutting_date !== undefined ? data.cutting_date : existing.cutting_date
      const lot_number = data.lot_number !== undefined ? data.lot_number : existing.lot_number
      const roll_id = data.roll_id !== undefined ? data.roll_id : existing.roll_id
      const employee_id = data.employee_id !== undefined ? data.employee_id : existing.employee_id
      const meter_used = data.meter_used !== undefined ? data.meter_used : parseFloat(existing.meter_used)

      if (data.meter_used !== undefined && data.meter_used !== parseFloat(existing.meter_used)) {
        const rollRes = await client.query('SELECT remaining_meter FROM rolls WHERE id = $1', [roll_id])
        if (rollRes.rows.length > 0) {
          const currentRemaining = parseFloat(rollRes.rows[0].remaining_meter || '0')
          const effectivelyAvailable = currentRemaining + (roll_id === oldRollId ? parseFloat(existing.meter_used) : 0)
          if (meter_used > effectivelyAvailable) {
            throw new Error(`Cannot cut ${meter_used}m. Roll #${roll_id} only has ${effectivelyAvailable}m available.`)
          }
        }
      }
      const layer_information = data.layer_information !== undefined ? data.layer_information : existing.layer_information
      const piece_count = data.piece_count !== undefined ? data.piece_count : existing.piece_count
      const size = data.size !== undefined ? data.size : existing.size
      const pana = data.pana !== undefined ? data.pana : existing.pana
      const average = data.average !== undefined ? data.average : existing.average
      const sort_number = data.sort_number !== undefined ? data.sort_number : existing.sort_number
      const notes = data.notes !== undefined ? data.notes : existing.notes

      await client.query(
        `UPDATE cutting_entries
         SET cutting_date = $1, lot_number = $2, roll_id = $3, employee_id = $4, meter_used = $5, layer_information = $6, 
             piece_count = $7, size = $8, pana = $9, average = $10, sort_number = $11, notes = $12, updated_at = NOW()
         WHERE id = $13`,
        [
          cutting_date,
          lot_number,
          roll_id,
          employee_id,
          meter_used,
          layer_information,
          piece_count,
          size,
          pana,
          average,
          sort_number,
          notes,
          id
        ]
      )

      await this.updateRollMeterAndStatus(client, roll_id)
      if (oldRollId !== roll_id) {
        await this.updateRollMeterAndStatus(client, oldRollId)
      }

      await client.query('COMMIT')
      return await this.getById(id)
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

      const existingRes = await client.query('SELECT * FROM cutting_entries WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      await client.query('DELETE FROM cutting_entries WHERE id = $1', [id])
      await this.updateRollMeterAndStatus(client, existing.roll_id)

      await client.query('COMMIT')
      return existing
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}
