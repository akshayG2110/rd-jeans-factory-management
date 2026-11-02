import { query, getClient } from '../db'
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
    let sql = 'SELECT * FROM expenses WHERE 1=1'
    const params: any[] = []

    if (filters.expense_category) {
      params.push(filters.expense_category)
      sql += ` AND expense_category = $${params.length}`
    }
    if (filters.payment_method) {
      params.push(filters.payment_method)
      sql += ` AND payment_method = $${params.length}`
    }
    if (filters.handled_by) {
      params.push(filters.handled_by)
      sql += ` AND handled_by = $${params.length}`
    }
    if (filters.date_from) {
      params.push(filters.date_from)
      sql += ` AND expense_date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND expense_date <= $${params.length}`
    }
    if (filters.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (party_name ILIKE $${params.length} OR notes ILIKE $${params.length} OR reference_number ILIKE $${params.length})`
    }

    sql += ' ORDER BY expense_date DESC, id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query('SELECT * FROM expenses WHERE id = $1', [id])
    return res.rows[0] || null
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const expRes = await client.query(
        `INSERT INTO expenses (expense_date, expense_category, party_name, amount, payment_method, handled_by, reference_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.expense_date,
          data.expense_category,
          data.party_name,
          data.amount,
          data.payment_method,
          data.handled_by,
          data.reference_number || null,
          data.notes || null
        ]
      )
      const expense = expRes.rows[0]

      await CashBookService.logTransaction(
        expense.expense_date,
        expense.expense_category,
        expense.party_name,
        expense.payment_method,
        0,
        parseFloat(expense.amount),
        expense.handled_by,
        'Expense',
        expense.id,
        expense.notes,
        client,
        { expense_id: expense.id }
      )

      await client.query('COMMIT')
      return expense
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM expenses WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      const expense_date = data.expense_date !== undefined ? data.expense_date : existing.expense_date
      const expense_category = data.expense_category !== undefined ? data.expense_category : existing.expense_category
      const party_name = data.party_name !== undefined ? data.party_name : existing.party_name
      const amount = data.amount !== undefined ? data.amount : parseFloat(existing.amount)
      const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
      const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
      const reference_number = data.reference_number !== undefined ? data.reference_number : existing.reference_number
      const notes = data.notes !== undefined ? data.notes : existing.notes

      const updateRes = await client.query(
        `UPDATE expenses
         SET expense_date = $1, expense_category = $2, party_name = $3, amount = $4, 
             payment_method = $5, handled_by = $6, reference_number = $7, notes = $8, updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [expense_date, expense_category, party_name, amount, payment_method, handled_by, reference_number, notes, id]
      )
      const updated = updateRes.rows[0]

      await CashBookService.updateByReference(
        'Expense',
        id,
        {
          name: party_name,
          amount,
          paymentMethod: payment_method,
          handledBy: handled_by,
          transactionDate: expense_date,
          notes,
          isIncome: false
        },
        client
      )

      await client.query('COMMIT')
      return updated
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

      const existingRes = await client.query('SELECT * FROM expenses WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      await client.query('DELETE FROM expenses WHERE id = $1', [id])
      await CashBookService.deleteByReference('Expense', id, client)

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
