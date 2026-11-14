import { getMongoDb, getNextSequence } from '../mongodb'
import { CashBookService } from './cashbook'

export interface IncomeRecord {
  id: number
  income_date: string
  income_source: string
  source_name: string
  amount: number | string
  payment_method: string
  handled_by: string
  reference_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export class IncomeService {
  static async getAll(filters: {
    income_source?: string
    payment_method?: string
    handled_by?: string
    date_from?: string
    date_to?: string
    search?: string
  }) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.income_source) queryFilter.income_source = filters.income_source
    if (filters.payment_method) queryFilter.payment_method = filters.payment_method
    if (filters.handled_by) queryFilter.handled_by = filters.handled_by

    if (filters.date_from || filters.date_to) {
      queryFilter.income_date = {}
      if (filters.date_from) queryFilter.income_date.$gte = filters.date_from
      if (filters.date_to) queryFilter.income_date.$lte = filters.date_to
    }

    if (filters.search) {
      queryFilter.$or = [
        { source_name: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
        { reference_number: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const records = await db.collection('incomes').find(queryFilter).sort({ income_date: -1, id: -1 }).toArray()
    return records.map(({ _id, ...rest }) => rest)
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const record = await db.collection('incomes').findOne({ id: Number(id) })
    if (!record) return null
    const { _id, ...rest } = record
    return rest
  }

  static async create(data: {
    income_date: string
    income_source: string
    source_name: string
    amount: number
    payment_method: string
    handled_by: string
    reference_number?: string | null
    notes?: string | null
  }) {
    const db = await getMongoDb()
    const id = await getNextSequence('incomes')
    const now = new Date().toISOString()
    const income = {
      id,
      income_date: data.income_date,
      income_source: data.income_source,
      source_name: data.source_name,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      handled_by: data.handled_by,
      reference_number: data.reference_number || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('incomes').insertOne(income)

    await CashBookService.logTransaction(
      income.income_date,
      income.income_source || 'Income',
      income.source_name,
      income.payment_method,
      Number(income.amount),
      0,
      income.handled_by,
      'Income',
      income.id,
      income.notes,
      undefined,
      { income_id: income.id }
    )

    const { _id, ...rest } = income as any
    return rest
  }

  static async update(
    id: number,
    data: Partial<{
      income_date: string
      income_source: string
      source_name: string
      amount: number
      payment_method: string
      handled_by: string
      reference_number: string | null
      notes: string | null
    }>
  ) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('incomes').findOne({ id: numId })
    if (!existing) return null

    const income_date = data.income_date !== undefined ? data.income_date : existing.income_date
    const income_source = data.income_source !== undefined ? data.income_source : existing.income_source
    const source_name = data.source_name !== undefined ? data.source_name : existing.source_name
    const amount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount)
    const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
    const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
    const reference_number = data.reference_number !== undefined ? data.reference_number : existing.reference_number
    const notes = data.notes !== undefined ? data.notes : existing.notes

    await db.collection('incomes').updateOne(
      { id: numId },
      {
        $set: {
          income_date,
          income_source,
          source_name,
          amount,
          payment_method,
          handled_by,
          reference_number,
          notes,
          updated_at: new Date().toISOString()
        }
      }
    )

    await CashBookService.updateByReference('Income', numId, {
      name: source_name,
      amount,
      paymentMethod: payment_method,
      handledBy: handled_by,
      transactionDate: income_date,
      notes,
      isIncome: true
    })

    const updated = await db.collection('incomes').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return rest
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('incomes').findOne({ id: numId })
    if (!existing) return null

    await db.collection('incomes').deleteOne({ id: numId })
    await CashBookService.deleteByReference('Income', numId)

    const { _id, ...rest } = existing
    return rest
  }
}
