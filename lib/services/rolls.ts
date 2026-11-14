import { getMongoDb, getNextSequence } from '../mongodb'

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
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.seth_id) queryFilter.seth_id = Number(filters.seth_id)
    if (filters.fabric_type) queryFilter.fabric_type = filters.fabric_type
    if (filters.status) queryFilter.status = filters.status

    if (filters.search) {
      queryFilter.$or = [
        { roll_number: { $regex: filters.search, $options: 'i' } },
        { short_number: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const rolls = await db.collection('rolls').find(queryFilter).sort({ entry_date: -1, id: -1 }).toArray()
    const seths = await db.collection('seths').find({}).toArray()
    const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))

    return rolls.map(r => {
      const { _id, ...rest } = r
      return {
        ...rest,
        seth_name: sethMap.get(r.seth_id) || ''
      }
    })
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const roll = await db.collection('rolls').findOne({ id: Number(id) })
    if (!roll) return null
    const seth = await db.collection('seths').findOne({ id: roll.seth_id })
    const { _id, ...rest } = roll
    return {
      ...rest,
      seth_name: seth?.seth_name || ''
    }
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
    const db = await getMongoDb()
    const numSethId = Number(data.seth_id)
    const seth = await db.collection('seths').findOne({ id: numSethId })
    if (!seth) {
      throw new Error(`Seth client with ID ${numSethId} does not exist.`)
    }

    const id = await getNextSequence('rolls')
    const now = new Date().toISOString()
    const received_meter = Number(data.received_meter)
    const newRoll = {
      id,
      seth_id: numSethId,
      entry_date: data.entry_date,
      roll_number: data.roll_number,
      short_number: data.short_number,
      fabric_type: data.fabric_type,
      received_meter,
      used_meter: 0,
      remaining_meter: received_meter,
      status: 'Available',
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('rolls').insertOne(newRoll)
    const { _id, ...rest } = newRoll as any
    return { ...rest, seth_name: seth.seth_name }
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
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('rolls').findOne({ id: numId })
    if (!existing) return null

    const seth_id = data.seth_id !== undefined ? Number(data.seth_id) : existing.seth_id
    const seth = await db.collection('seths').findOne({ id: seth_id })
    if (!seth) {
      throw new Error(`Seth client with ID ${seth_id} does not exist.`)
    }

    const entry_date = data.entry_date !== undefined ? data.entry_date : existing.entry_date
    const roll_number = data.roll_number !== undefined ? data.roll_number : existing.roll_number
    const short_number = data.short_number !== undefined ? data.short_number : existing.short_number
    const fabric_type = data.fabric_type !== undefined ? data.fabric_type : existing.fabric_type
    const received_meter = data.received_meter !== undefined ? Number(data.received_meter) : Number(existing.received_meter)
    const notes = data.notes !== undefined ? data.notes : existing.notes

    const used_meter = Number(existing.used_meter || 0)
    const remaining_meter = received_meter - used_meter
    let status = 'Available'
    if (remaining_meter <= 0) {
      status = 'Completed'
    } else if (used_meter > 0) {
      status = 'Partially Used'
    }

    await db.collection('rolls').updateOne(
      { id: numId },
      {
        $set: {
          seth_id,
          entry_date,
          roll_number,
          short_number,
          fabric_type,
          received_meter,
          remaining_meter,
          status,
          notes,
          updated_at: new Date().toISOString()
        }
      }
    )

    const updated = await db.collection('rolls').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return { ...rest, seth_name: seth.seth_name }
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const roll = await db.collection('rolls').findOne({ id: numId })
    if (!roll) return null
    await db.collection('rolls').deleteOne({ id: numId })
    const { _id, ...rest } = roll
    return rest
  }
}
