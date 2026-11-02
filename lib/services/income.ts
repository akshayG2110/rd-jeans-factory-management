import { query, getClient } from '../db'
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
    let sql = 'SELECT * FROM incomes WHERE 1=1'
    const params: any[] = []

    if (filters.income_source) {
      params.push(filters.income_source)
      sql += ` AND income_source = $${params.length}`
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
      sql += ` AND income_date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND income_date <= $${params.length}`
    }
    if (filters.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (source_name ILIKE $${params.length} OR notes ILIKE $${params.length} OR reference_number ILIKE $${params.length})`
    }

    sql += ' ORDER BY income_date DESC, id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getById(id: number) {
    const res = await query('SELECT * FROM incomes WHERE id = $1', [id])
    return res.rows[0] || null
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const incRes = await client.query(
        `INSERT INTO incomes (income_date, income_source, source_name, amount, payment_method, handled_by, reference_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.income_date,
          data.income_source,
          data.source_name,
          data.amount,
          data.payment_method,
          data.handled_by,
          data.reference_number || null,
          data.notes || null
        ]
      )
      const income = incRes.rows[0]

      await CashBookService.logTransaction(
        income.income_date,
        income.income_source || 'Income',
        income.source_name,
        income.payment_method,
        parseFloat(income.amount),
        0,
        income.handled_by,
        'Income',
        income.id,
        income.notes,
        client,
        { income_id: income.id }
      )

      await client.query('COMMIT')
      return income
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
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const existingRes = await client.query('SELECT * FROM incomes WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      const income_date = data.income_date !== undefined ? data.income_date : existing.income_date
      const income_source = data.income_source !== undefined ? data.income_source : existing.income_source
      const source_name = data.source_name !== undefined ? data.source_name : existing.source_name
      const amount = data.amount !== undefined ? data.amount : parseFloat(existing.amount)
      const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method
      const handled_by = data.handled_by !== undefined ? data.handled_by : existing.handled_by
      const reference_number = data.reference_number !== undefined ? data.reference_number : existing.reference_number
      const notes = data.notes !== undefined ? data.notes : existing.notes

      const updateRes = await client.query(
        `UPDATE incomes
         SET income_date = $1, income_source = $2, source_name = $3, amount = $4, 
             payment_method = $5, handled_by = $6, reference_number = $7, notes = $8, updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [income_date, income_source, source_name, amount, payment_method, handled_by, reference_number, notes, id]
      )
      const updated = updateRes.rows[0]

      await CashBookService.updateByReference(
        'Income',
        id,
        {
          name: source_name,
          amount,
          paymentMethod: payment_method,
          handledBy: handled_by,
          transactionDate: income_date,
          notes,
          isIncome: true
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

      const existingRes = await client.query('SELECT * FROM incomes WHERE id = $1', [id])
      const existing = existingRes.rows[0]
      if (!existing) return null

      await client.query('DELETE FROM incomes WHERE id = $1', [id])
      await CashBookService.deleteByReference('Income', id, client)

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
