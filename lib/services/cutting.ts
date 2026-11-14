import { getMongoDb, getNextSequence } from '../mongodb'

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
  private static async updateRollMeterAndStatus(rollId: number) {
    const db = await getMongoDb()
    const numRollId = Number(rollId)
    const cuts = await db.collection('cutting_entries').find({ roll_id: numRollId }).toArray()
    const totalUsed = cuts.reduce((sum, c) => sum + (Number(c.meter_used) || 0), 0)

    const roll = await db.collection('rolls').findOne({ id: numRollId })
    if (!roll) return

    const receivedMeter = Number(roll.received_meter) || 0
    const remainingMeter = receivedMeter - totalUsed

    let status = 'Available'
    if (remainingMeter <= 0) {
      status = 'Completed'
    } else if (totalUsed > 0) {
      status = 'Partially Used'
    }

    await db.collection('rolls').updateOne(
      { id: numRollId },
      {
        $set: {
          used_meter: totalUsed,
          remaining_meter: remainingMeter,
          status,
          updated_at: new Date().toISOString()
        }
      }
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
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.roll_id) queryFilter.roll_id = Number(filters.roll_id)
    if (filters.employee_id) queryFilter.employee_id = Number(filters.employee_id)
    if (filters.size) queryFilter.size = filters.size
    if (filters.sort_number) queryFilter.sort_number = filters.sort_number

    if (filters.date_from || filters.date_to) {
      queryFilter.cutting_date = {}
      if (filters.date_from) queryFilter.cutting_date.$gte = filters.date_from
      if (filters.date_to) queryFilter.cutting_date.$lte = filters.date_to
    }

    if (filters.search) {
      queryFilter.$or = [
        { lot_number: { $regex: filters.search, $options: 'i' } },
        { sort_number: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const cuts = await db.collection('cutting_entries').find(queryFilter).sort({ cutting_date: -1, id: -1 }).toArray()
    const rolls = await db.collection('rolls').find({}).toArray()
    const seths = await db.collection('seths').find({}).toArray()
    const employees = await db.collection('employees').find({}).toArray()

    const rollMap = new Map(rolls.map(r => [r.id, r]))
    const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))
    const empMap = new Map(employees.map(e => [e.id, e]))

    return cuts.map(c => {
      const { _id, ...rest } = c
      const roll = rollMap.get(c.roll_id)
      const emp = c.employee_id ? empMap.get(c.employee_id) : null
      return {
        ...rest,
        roll_number: roll?.roll_number || '',
        fabric_type: roll?.fabric_type || '',
        seth_name: roll ? sethMap.get(roll.seth_id) || '' : '',
        employee_name: emp?.employee_name || null,
        employee_role: emp?.role || null
      }
    })
  }

  static async getById(id: number): Promise<CuttingEntry | null> {
    const db = await getMongoDb()
    const numId = Number(id)
    const cut = await db.collection('cutting_entries').findOne({ id: numId })
    if (!cut) return null

    const roll = await db.collection('rolls').findOne({ id: cut.roll_id })
    const seth = roll ? await db.collection('seths').findOne({ id: roll.seth_id }) : null
    const emp = cut.employee_id ? await db.collection('employees').findOne({ id: cut.employee_id }) : null
    const finishedGoods = await db.collection('finished_goods').find({ cutting_id: numId }).sort({ id: 1 }).toArray()

    return {
      id: Number(cut.id),
      cutting_date: String(cut.cutting_date),
      lot_number: String(cut.lot_number),
      roll_id: Number(cut.roll_id),
      employee_id: cut.employee_id ? Number(cut.employee_id) : null,
      meter_used: Number(cut.meter_used),
      layer_information: cut.layer_information || null,
      piece_count: Number(cut.piece_count),
      size: String(cut.size),
      pana: cut.pana !== undefined ? Number(cut.pana) : null,
      average: cut.average !== undefined ? Number(cut.average) : null,
      sort_number: cut.sort_number || null,
      notes: cut.notes || null,
      created_at: String(cut.created_at || ''),
      updated_at: String(cut.updated_at || ''),
      roll_number: roll?.roll_number || '',
      fabric_type: roll?.fabric_type || '',
      seth_name: seth?.seth_name || '',
      employee_name: emp?.employee_name || null,
      employee_role: emp?.role || null,
      finished_goods: finishedGoods.map(({ _id, ...fg }) => fg)
    }
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
    const db = await getMongoDb()
    const numRollId = Number(data.roll_id)
    const roll = await db.collection('rolls').findOne({ id: numRollId })
    if (!roll) {
      throw new Error(`Roll with ID ${numRollId} does not exist.`)
    }

    const remainingMeter = Number(roll.remaining_meter || 0)
    if (data.meter_used > remainingMeter) {
      throw new Error(`Cannot cut ${data.meter_used}m. Roll #${numRollId} only has ${remainingMeter}m remaining.`)
    }

    if (data.employee_id) {
      const emp = await db.collection('employees').findOne({ id: Number(data.employee_id) })
      if (!emp) {
        throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
      }
    }

    const id = await getNextSequence('cutting_entries')
    const now = new Date().toISOString()
    const newCut = {
      id,
      cutting_date: data.cutting_date,
      lot_number: data.lot_number,
      roll_id: numRollId,
      employee_id: data.employee_id ? Number(data.employee_id) : null,
      meter_used: Number(data.meter_used),
      layer_information: data.layer_information || null,
      piece_count: Number(data.piece_count),
      size: data.size,
      pana: data.pana || null,
      average: data.average || null,
      sort_number: data.sort_number || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('cutting_entries').insertOne(newCut)

    // Automatically initialize linked Finished Goods
    const fgId = await getNextSequence('finished_goods')
    await db.collection('finished_goods').insertOne({
      id: fgId,
      cutting_id: id,
      seth_id: roll.seth_id,
      lot_number: data.lot_number,
      item_name: 'Denim Jeans',
      size: data.size,
      color_shade: 'Standard Indigo',
      total_pieces: Number(data.piece_count),
      stitching_pieces: 0,
      finished_pieces: Number(data.piece_count),
      rejected_pieces: 0,
      dispatched_pieces: 0,
      status: 'Cut',
      unit_price: 0,
      dispatch_date: null,
      notes: `Initial production yield from Roll #${numRollId}`,
      created_at: now,
      updated_at: now
    })

    await this.updateRollMeterAndStatus(numRollId)
    return await this.getById(id)
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
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('cutting_entries').findOne({ id: numId })
    if (!existing) return null

    const oldRollId = existing.roll_id

    if (data.employee_id !== undefined && data.employee_id !== null) {
      const emp = await db.collection('employees').findOne({ id: Number(data.employee_id) })
      if (!emp) {
        throw new Error(`Employee with ID ${data.employee_id} does not exist.`)
      }
    }

    const cutting_date = data.cutting_date !== undefined ? data.cutting_date : existing.cutting_date
    const lot_number = data.lot_number !== undefined ? data.lot_number : existing.lot_number
    const roll_id = data.roll_id !== undefined ? Number(data.roll_id) : existing.roll_id
    const employee_id = data.employee_id !== undefined ? (data.employee_id ? Number(data.employee_id) : null) : existing.employee_id
    const meter_used = data.meter_used !== undefined ? Number(data.meter_used) : Number(existing.meter_used)

    if (data.meter_used !== undefined && data.meter_used !== Number(existing.meter_used)) {
      const roll = await db.collection('rolls').findOne({ id: roll_id })
      if (roll) {
        const currentRemaining = Number(roll.remaining_meter || 0)
        const effectivelyAvailable = currentRemaining + (roll_id === oldRollId ? Number(existing.meter_used) : 0)
        if (meter_used > effectivelyAvailable) {
          throw new Error(`Cannot cut ${meter_used}m. Roll #${roll_id} only has ${effectivelyAvailable}m available.`)
        }
      }
    }

    await db.collection('cutting_entries').updateOne(
      { id: numId },
      {
        $set: {
          cutting_date,
          lot_number,
          roll_id,
          employee_id,
          meter_used,
          layer_information: data.layer_information !== undefined ? data.layer_information : existing.layer_information,
          piece_count: data.piece_count !== undefined ? Number(data.piece_count) : existing.piece_count,
          size: data.size !== undefined ? data.size : existing.size,
          pana: data.pana !== undefined ? data.pana : existing.pana,
          average: data.average !== undefined ? data.average : existing.average,
          sort_number: data.sort_number !== undefined ? data.sort_number : existing.sort_number,
          notes: data.notes !== undefined ? data.notes : existing.notes,
          updated_at: new Date().toISOString()
        }
      }
    )

    await this.updateRollMeterAndStatus(roll_id)
    if (oldRollId !== roll_id) {
      await this.updateRollMeterAndStatus(oldRollId)
    }

    return await this.getById(numId)
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('cutting_entries').findOne({ id: numId })
    if (!existing) return null

    await Promise.all([
      db.collection('cutting_entries').deleteOne({ id: numId }),
      db.collection('finished_goods').deleteMany({ cutting_id: numId })
    ])

    await this.updateRollMeterAndStatus(existing.roll_id)
    const { _id, ...rest } = existing
    return rest
  }
}
