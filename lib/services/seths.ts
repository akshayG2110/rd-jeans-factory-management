import { getMongoDb, getNextSequence } from '../mongodb'
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
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (search) {
      queryFilter.seth_name = { $regex: search, $options: 'i' }
    }
    if (status) {
      queryFilter.status = status
    }

    const seths = await db.collection('seths').find(queryFilter).sort({ id: -1 }).toArray()
    return seths.map(({ _id, ...rest }) => rest)
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const seth = await db.collection('seths').findOne({ id: Number(id) })
    if (!seth) return null
    const { _id, ...rest } = seth
    return rest
  }

  static async create(data: { seth_name: string; mobile_number?: string | null; address?: string | null; notes?: string | null; status?: string }) {
    const db = await getMongoDb()
    const id = await getNextSequence('seths')
    const now = new Date().toISOString()
    const newSeth = {
      id,
      seth_name: data.seth_name,
      mobile_number: data.mobile_number || null,
      address: data.address || null,
      notes: data.notes || null,
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    }

    await db.collection('seths').insertOne(newSeth)
    const { _id, ...rest } = newSeth as any
    return rest
  }

  static async update(id: number, data: Partial<{ seth_name: string; mobile_number: string | null; address: string | null; notes: string | null; status: string }>) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('seths').findOne({ id: numId })
    if (!existing) return null

    const updateFields: any = {
      updated_at: new Date().toISOString()
    }
    if (data.seth_name !== undefined) updateFields.seth_name = data.seth_name
    if (data.mobile_number !== undefined) updateFields.mobile_number = data.mobile_number
    if (data.address !== undefined) updateFields.address = data.address
    if (data.notes !== undefined) updateFields.notes = data.notes
    if (data.status !== undefined) updateFields.status = data.status

    await db.collection('seths').updateOne({ id: numId }, { $set: updateFields })
    const updated = await db.collection('seths').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return rest
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const sethToDelete = await db.collection('seths').findOne({ id: numId })
    if (!sethToDelete) return null

    await Promise.all([
      db.collection('seths').deleteOne({ id: numId }),
      db.collection('seth_payments').deleteMany({ seth_id: numId }),
      db.collection('rolls').deleteMany({ seth_id: numId })
    ])

    const { _id, ...rest } = sethToDelete
    return rest
  }

  // Seth Payment Operations
  static async addPayment(sethId: number, data: {
    payment_date: string
    amount: number
    payment_method: string
    notes?: string | null
    handled_by: string
  }) {
    const db = await getMongoDb()
    const numSethId = Number(sethId)
    const seth = await db.collection('seths').findOne({ id: numSethId })
    if (!seth) {
      throw new Error(`Seth client with ID ${numSethId} does not exist.`)
    }

    const id = await getNextSequence('seth_payments')
    const now = new Date().toISOString()
    const payment = {
      id,
      seth_id: numSethId,
      payment_date: data.payment_date,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      notes: data.notes || null,
      handled_by: data.handled_by,
      created_at: now,
      updated_at: now
    }

    await db.collection('seth_payments').insertOne(payment)

    await CashBookService.logTransaction(
      payment.payment_date,
      'Seth Payment',
      seth.seth_name,
      payment.payment_method,
      Number(payment.amount),
      0,
      payment.handled_by,
      'Seth Payment',
      payment.id,
      payment.notes,
      undefined,
      { seth_payment_id: payment.id }
    )

    const { _id, ...rest } = payment as any
    return rest
  }

  static async getPayments(sethId: number) {
    const db = await getMongoDb()
    const numSethId = Number(sethId)
    const payments = await db
      .collection('seth_payments')
      .find({ seth_id: numSethId })
      .sort({ payment_date: -1, id: -1 })
      .toArray()
    return payments.map(({ _id, ...rest }) => rest)
  }
}
