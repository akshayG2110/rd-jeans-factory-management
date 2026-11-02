import { query, getClient } from '../db'

export interface FinishedGoodsRecord {
  id: number
  cutting_id: number
  seth_id?: number | null
  lot_number: string
  item_name: string
  size: string
  color_shade: string
  total_pieces: number
  stitching_pieces: number
  finished_pieces: number
  rejected_pieces: number
  dispatched_pieces: number
  status: 'Cut' | 'In Stitching' | 'Washing' | 'Ready' | 'Dispatched' | 'Closed'
  unit_price: number | string
  dispatch_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  seth_name?: string
  fabric_type?: string
  roll_number?: string
  cutter_name?: string
}

export class FinishedGoodsService {
  static async getAll(filters?: {
    cutting_id?: number
    seth_id?: number
    status?: string
    size?: string
    search?: string
  }) {
    let sql = `
      SELECT fg.*, 
             s.seth_name, 
             r.fabric_type, 
             r.roll_number,
             e.employee_name as cutter_name
      FROM finished_goods fg
      LEFT JOIN cutting_entries c ON fg.cutting_id = c.id
      LEFT JOIN rolls r ON c.roll_id = r.id
      LEFT JOIN seths s ON fg.seth_id = s.id
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.cutting_id) {
      params.push(filters.cutting_id)
      sql += ` AND fg.cutting_id = $${params.length}`
    }
    if (filters?.seth_id) {
      params.push(filters.seth_id)
      sql += ` AND fg.seth_id = $${params.length}`
    }
    if (filters?.status) {
      params.push(filters.status)
      sql += ` AND fg.status = $${params.length}`
    }
    if (filters?.size) {
      params.push(filters.size)
      sql += ` AND fg.size = $${params.length}`
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (fg.lot_number ILIKE $${params.length} OR fg.item_name ILIKE $${params.length} OR s.seth_name ILIKE $${params.length} OR fg.color_shade ILIKE $${params.length})`
    }

    sql += ' ORDER BY fg.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query(
      `SELECT fg.*, 
              s.seth_name, 
              r.fabric_type, 
              r.roll_number,
              e.employee_name as cutter_name
       FROM finished_goods fg
       LEFT JOIN cutting_entries c ON fg.cutting_id = c.id
       LEFT JOIN rolls r ON c.roll_id = r.id
       LEFT JOIN seths s ON fg.seth_id = s.id
       LEFT JOIN employees e ON c.employee_id = e.id
       WHERE fg.id = $1`,
      [id]
    )
    return res.rows[0] || null
  }

  static async getByCuttingId(cuttingId: number) {
    return this.getAll({ cutting_id: cuttingId })
  }

  static async create(data: {
    cutting_id: number
    seth_id?: number | null
    lot_number: string
    item_name?: string
    size: string
    color_shade?: string
    total_pieces: number
    stitching_pieces?: number
    finished_pieces?: number
    rejected_pieces?: number
    dispatched_pieces?: number
    status?: 'Cut' | 'In Stitching' | 'Washing' | 'Ready' | 'Dispatched' | 'Closed'
    unit_price?: number
    dispatch_date?: string | null
    notes?: string | null
  }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      // Verify cutting entry exists
      const cutRes = await client.query(
        `SELECT c.id, c.lot_number, r.seth_id
         FROM cutting_entries c
         LEFT JOIN rolls r ON c.roll_id = r.id
         WHERE c.id = $1`,
        [data.cutting_id]
      )
      if (cutRes.rows.length === 0) {
        throw new Error(`Cutting entry with ID ${data.cutting_id} does not exist.`)
      }

      const cutEntry = cutRes.rows[0]
      const sethId = data.seth_id !== undefined ? data.seth_id : cutEntry.seth_id
      const lotNumber = data.lot_number || cutEntry.lot_number

      const insertRes = await client.query(
        `INSERT INTO finished_goods 
         (cutting_id, seth_id, lot_number, item_name, size, color_shade, 
          total_pieces, stitching_pieces, finished_pieces, rejected_pieces, dispatched_pieces, 
          status, unit_price, dispatch_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          data.cutting_id,
          sethId || null,
          lotNumber,
          data.item_name || 'Denim Jeans',
          data.size,
          data.color_shade || 'Standard Indigo',
          data.total_pieces,
          data.stitching_pieces || 0,
          data.finished_pieces || 0,
          data.rejected_pieces || 0,
          data.dispatched_pieces || 0,
          data.status || 'Cut',
          data.unit_price || 0.00,
          data.dispatch_date || null,
          data.notes || null
        ]
      )

      await client.query('COMMIT')
      return await this.getById(insertRes.rows[0].id)
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
      seth_id: number | null
      item_name: string
      size: string
      color_shade: string
      total_pieces: number
      stitching_pieces: number
      finished_pieces: number
      rejected_pieces: number
      dispatched_pieces: number
      status: 'Cut' | 'In Stitching' | 'Washing' | 'Ready' | 'Dispatched' | 'Closed'
      unit_price: number
      dispatch_date: string | null
      notes: string | null
    }>
  ) {
    const existing = await this.getById(id)
    if (!existing) return null

    const seth_id = data.seth_id !== undefined ? data.seth_id : existing.seth_id
    const item_name = data.item_name !== undefined ? data.item_name : existing.item_name
    const size = data.size !== undefined ? data.size : existing.size
    const color_shade = data.color_shade !== undefined ? data.color_shade : existing.color_shade
    const total_pieces = data.total_pieces !== undefined ? data.total_pieces : existing.total_pieces
    const stitching_pieces = data.stitching_pieces !== undefined ? data.stitching_pieces : existing.stitching_pieces
    const finished_pieces = data.finished_pieces !== undefined ? data.finished_pieces : existing.finished_pieces
    const rejected_pieces = data.rejected_pieces !== undefined ? data.rejected_pieces : existing.rejected_pieces
    const dispatched_pieces = data.dispatched_pieces !== undefined ? data.dispatched_pieces : existing.dispatched_pieces
    const status = data.status !== undefined ? data.status : existing.status
    const unit_price = data.unit_price !== undefined ? data.unit_price : existing.unit_price
    const dispatch_date = data.dispatch_date !== undefined ? data.dispatch_date : existing.dispatch_date
    const notes = data.notes !== undefined ? data.notes : existing.notes

    await query(
      `UPDATE finished_goods
       SET seth_id = $1, item_name = $2, size = $3, color_shade = $4,
           total_pieces = $5, stitching_pieces = $6, finished_pieces = $7, 
           rejected_pieces = $8, dispatched_pieces = $9, status = $10, 
           unit_price = $11, dispatch_date = $12, notes = $13, updated_at = NOW()
       WHERE id = $14`,
      [
        seth_id,
        item_name,
        size,
        color_shade,
        total_pieces,
        stitching_pieces,
        finished_pieces,
        rejected_pieces,
        dispatched_pieces,
        status,
        unit_price,
        dispatch_date,
        notes,
        id
      ]
    )

    return await this.getById(id)
  }

  static async updateStage(
    id: number,
    stageData: {
      status: 'Cut' | 'In Stitching' | 'Washing' | 'Ready' | 'Dispatched' | 'Closed'
      stitching_pieces?: number
      finished_pieces?: number
      rejected_pieces?: number
      dispatched_pieces?: number
      dispatch_date?: string | null
      notes?: string | null
    }
  ) {
    return this.update(id, stageData)
  }

  static async delete(id: number) {
    const existing = await this.getById(id)
    if (!existing) return null

    await query('DELETE FROM finished_goods WHERE id = $1', [id])
    return existing
  }

  static async getSummary() {
    const res = await query(`
      SELECT 
        COALESCE(SUM(total_pieces), 0) as total_cut,
        COALESCE(SUM(stitching_pieces), 0) as total_in_stitching,
        COALESCE(SUM(finished_pieces), 0) as total_ready,
        COALESCE(SUM(dispatched_pieces), 0) as total_dispatched,
        COALESCE(SUM(rejected_pieces), 0) as total_rejected,
        COUNT(id) as total_batches
      FROM finished_goods
    `)
    const row = res.rows[0]
    return {
      totalCut: parseInt(row.total_cut, 10),
      totalInStitching: parseInt(row.total_in_stitching, 10),
      totalReady: parseInt(row.total_ready, 10),
      totalDispatched: parseInt(row.total_dispatched, 10),
      totalRejected: parseInt(row.total_rejected, 10),
      totalBatches: parseInt(row.total_batches, 10)
    }
  }
}
