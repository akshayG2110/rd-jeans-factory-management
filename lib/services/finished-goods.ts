import { getMongoDb, getNextSequence } from '../mongodb'

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
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters?.cutting_id) queryFilter.cutting_id = Number(filters.cutting_id)
    if (filters?.seth_id) queryFilter.seth_id = Number(filters.seth_id)
    if (filters?.status) queryFilter.status = filters.status
    if (filters?.size) queryFilter.size = filters.size

    if (filters?.search) {
      queryFilter.$or = [
        { lot_number: { $regex: filters.search, $options: 'i' } },
        { item_name: { $regex: filters.search, $options: 'i' } },
        { color_shade: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const fgList = await db.collection('finished_goods').find(queryFilter).sort({ id: -1 }).toArray()
    const cuttings = await db.collection('cutting_entries').find({}).toArray()
    const rolls = await db.collection('rolls').find({}).toArray()
    const seths = await db.collection('seths').find({}).toArray()
    const employees = await db.collection('employees').find({}).toArray()

    const cutMap = new Map(cuttings.map(c => [c.id, c]))
    const rollMap = new Map(rolls.map(r => [r.id, r]))
    const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))
    const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

    return fgList.map(fg => {
      const { _id, ...rest } = fg
      const cut = cutMap.get(fg.cutting_id)
      const roll = cut ? rollMap.get(cut.roll_id) : null
      return {
        ...rest,
        seth_name: fg.seth_id ? sethMap.get(fg.seth_id) || '' : '',
        fabric_type: roll?.fabric_type || '',
        roll_number: roll?.roll_number || '',
        cutter_name: cut?.employee_id ? empMap.get(cut.employee_id) || '' : ''
      }
    })
  }

  static async getById(id: number): Promise<FinishedGoodsRecord | null> {
    const db = await getMongoDb()
    const numId = Number(id)
    const fg = await db.collection('finished_goods').findOne({ id: numId })
    if (!fg) return null

    const cut = await db.collection('cutting_entries').findOne({ id: fg.cutting_id })
    const roll = cut ? await db.collection('rolls').findOne({ id: cut.roll_id }) : null
    const seth = fg.seth_id ? await db.collection('seths').findOne({ id: fg.seth_id }) : null
    const emp = cut?.employee_id ? await db.collection('employees').findOne({ id: cut.employee_id }) : null

    return {
      id: Number(fg.id),
      cutting_id: Number(fg.cutting_id),
      seth_id: fg.seth_id ? Number(fg.seth_id) : null,
      lot_number: String(fg.lot_number),
      item_name: String(fg.item_name || 'Denim Jeans'),
      size: String(fg.size),
      color_shade: String(fg.color_shade || 'Standard Indigo'),
      total_pieces: Number(fg.total_pieces || 0),
      stitching_pieces: Number(fg.stitching_pieces || 0),
      finished_pieces: Number(fg.finished_pieces || 0),
      rejected_pieces: Number(fg.rejected_pieces || 0),
      dispatched_pieces: Number(fg.dispatched_pieces || 0),
      status: fg.status as any,
      unit_price: Number(fg.unit_price || 0),
      dispatch_date: fg.dispatch_date || null,
      notes: fg.notes || null,
      created_at: String(fg.created_at || ''),
      updated_at: String(fg.updated_at || ''),
      seth_name: seth?.seth_name || '',
      fabric_type: roll?.fabric_type || '',
      roll_number: roll?.roll_number || '',
      cutter_name: emp?.employee_name || ''
    }
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
    const db = await getMongoDb()
    const numCuttingId = Number(data.cutting_id)
    const cut = await db.collection('cutting_entries').findOne({ id: numCuttingId })
    if (!cut) {
      throw new Error(`Cutting entry with ID ${numCuttingId} does not exist.`)
    }

    const roll = await db.collection('rolls').findOne({ id: cut.roll_id })
    const sethId = data.seth_id !== undefined ? (data.seth_id ? Number(data.seth_id) : null) : (roll?.seth_id || null)

    const id = await getNextSequence('finished_goods')
    const now = new Date().toISOString()
    const newFg = {
      id,
      cutting_id: numCuttingId,
      seth_id: sethId,
      lot_number: data.lot_number || cut.lot_number,
      item_name: data.item_name || 'Denim Jeans',
      size: data.size,
      color_shade: data.color_shade || 'Standard Indigo',
      total_pieces: Number(data.total_pieces),
      stitching_pieces: Number(data.stitching_pieces || 0),
      finished_pieces: Number(data.finished_pieces || 0),
      rejected_pieces: Number(data.rejected_pieces || 0),
      dispatched_pieces: Number(data.dispatched_pieces || 0),
      status: data.status || 'Cut',
      unit_price: Number(data.unit_price || 0),
      dispatch_date: data.dispatch_date || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('finished_goods').insertOne(newFg)
    return await this.getById(id)
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
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('finished_goods').findOne({ id: numId })
    if (!existing) return null

    const updateFields: any = {
      updated_at: new Date().toISOString()
    }
    if (data.seth_id !== undefined) updateFields.seth_id = data.seth_id ? Number(data.seth_id) : null
    if (data.item_name !== undefined) updateFields.item_name = data.item_name
    if (data.size !== undefined) updateFields.size = data.size
    if (data.color_shade !== undefined) updateFields.color_shade = data.color_shade
    if (data.total_pieces !== undefined) updateFields.total_pieces = Number(data.total_pieces)
    if (data.stitching_pieces !== undefined) updateFields.stitching_pieces = Number(data.stitching_pieces)
    if (data.finished_pieces !== undefined) updateFields.finished_pieces = Number(data.finished_pieces)
    if (data.rejected_pieces !== undefined) updateFields.rejected_pieces = Number(data.rejected_pieces)
    if (data.dispatched_pieces !== undefined) updateFields.dispatched_pieces = Number(data.dispatched_pieces)
    if (data.status !== undefined) updateFields.status = data.status
    if (data.unit_price !== undefined) updateFields.unit_price = Number(data.unit_price)
    if (data.dispatch_date !== undefined) updateFields.dispatch_date = data.dispatch_date
    if (data.notes !== undefined) updateFields.notes = data.notes

    await db.collection('finished_goods').updateOne({ id: numId }, { $set: updateFields })
    return await this.getById(numId)
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

    const db = await getMongoDb()
    await db.collection('finished_goods').deleteOne({ id: Number(id) })
    return existing
  }

  static async getSummary() {
    const db = await getMongoDb()
    const all = await db.collection('finished_goods').find({}).toArray()

    let totalCut = 0
    let totalInStitching = 0
    let totalReady = 0
    let totalDispatched = 0
    let totalRejected = 0

    for (const fg of all) {
      totalCut += Number(fg.total_pieces || 0)
      totalInStitching += Number(fg.stitching_pieces || 0)
      totalReady += Number(fg.finished_pieces || 0)
      totalDispatched += Number(fg.dispatched_pieces || 0)
      totalRejected += Number(fg.rejected_pieces || 0)
    }

    return {
      totalCut,
      totalInStitching,
      totalReady,
      totalDispatched,
      totalRejected,
      totalBatches: all.length
    }
  }
}
