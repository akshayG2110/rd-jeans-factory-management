import { getMongoDb, getNextSequence } from '../mongodb'
import { CashBookService } from './cashbook'

export interface ExpenseRecord {
  id: number
  expense_date: string
  expense_category: string
  party_name: string
  amount: number | string
  payment_method: string
  handled_by: string
  reference_number?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export class ExpenseService {
  static async getAll(filters: {
    expense_category?: string
    payment_method?: string
    handled_by?: string
    date_from?: string
    date_to?: string
    search?: string
  }) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.expense_category) queryFilter.expense_category = filters.expense_category
    if (filters.payment_method) queryFilter.payment_method = filters.payment_method
    if (filters.handled_by) queryFilter.handled_by = filters.handled_by

    if (filters.date_from || filters.date_to) {
      queryFilter.expense_date = {}
      if (filters.date_from) queryFilter.expense_date.$gte = filters.date_from
      if (filters.date_to) queryFilter.expense_date.$lte = filters.date_to
    }

    if (filters.search) {
      queryFilter.$or = [
        { party_name: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
        { reference_number: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const records = await db.collection('expenses').find(queryFilter).sort({ expense_date: -1, id: -1 }).toArray()
    return records.map(({ _id, ...rest }) => rest)
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const record = await db.collection('expenses').findOne({ id: Number(id) })
    if (!record) return null
    const { _id, ...rest } = record
    return rest
  }

  static async create(data: {
    expense_date: string
    expense_category: string
    party_name: string
    amount: number
    payment_method: string
    handled_by: string
    reference_number?: string | null
    notes?: string | null
  }) {
    const db = await getMongoDb()
    const id = await getNextSequence('expenses')
    const now = new Date().toISOString()
    const expense = {
      id,
      expense_date: data.expense_date,
      expense_category: data.expense_category,
      party_name: data.party_name,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      handled_by: data.handled_by,
      reference_number: data.reference_number || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('expenses').insertOne(expense)

    await CashBookService.logTransaction(
      expense.expense_date,
      expense.expense_category,
      expense.party_name,
      expense.payment_method,
      0,
      Number(expense.amount),
      expense.handled_by,
      'Expense',
      expense.id,
      expense.notes,
      undefined,
      { expense_id: expense.id }
    )

    const { _id, ...rest } = expense as any
    return rest
  }

  static async update(
    id: number,
    data: Partial<{
      expense_date: string
      expense_category: string
      party_name: string
      amount: number
      payment_method: string
      handled_by: string
      reference_number: string | null
      notes: string | null
    }>
  ) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('expenses').findOne({ id: numId })
    if (!existing) return null

    const expense_date = data.expense_date !== undefined ? data.expense_date : existing.expense_date
    const expense_category = data.expense_category !== undefined ? data.expense_category : existing.expense_category
    const party_name = data.party_name !== undefined ? data.party_name : existing.party_name
    const amount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount)
    const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
    const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
    const reference_number = data.reference_number !== undefined ? data.reference_number : existing.reference_number
    const notes = data.notes !== undefined ? data.notes : existing.notes

    await db.collection('expenses').updateOne(
      { id: numId },
      {
        $set: {
          expense_date,
          expense_category,
          party_name,
          amount,
          payment_method,
          handled_by,
          reference_number,
          notes,
          updated_at: new Date().toISOString()
        }
      }
    )

    await CashBookService.updateByReference('Expense', numId, {
      name: party_name,
      amount,
      paymentMethod: payment_method,
      handledBy: handled_by,
      transactionDate: expense_date,
      notes,
      isIncome: false
    })

    const updated = await db.collection('expenses').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return rest
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('expenses').findOne({ id: numId })
    if (!existing) return null

    await db.collection('expenses').deleteOne({ id: numId })
    await CashBookService.deleteByReference('Expense', numId)

    const { _id, ...rest } = existing
    return rest
  }
}
