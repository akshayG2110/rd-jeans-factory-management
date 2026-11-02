import { query, getClient } from '../db'

export interface CashBookRecord {
  id: number
  transaction_date: string
  transaction_type: string
  name: string
  payment_method: string
  income_amount: number | string
  out_amount: number | string
  running_balance: number | string
  handled_by: string
  reference_module: string
  reference_id: number
  upad_id?: number | null
  salary_id?: number | null
  seth_payment_id?: number | null
  income_id?: number | null
  expense_id?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CashBookForeignKeys {
  upad_id?: number | null
  salary_id?: number | null
  seth_payment_id?: number | null
  income_id?: number | null
  expense_id?: number | null
  partner_id?: number | null
}

export class CashBookService {
  /**
   * Recalculate running balances atomically using a single SQL window function (O(1) database trip)
   */
  static async recalculateBalancesFrom(startId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    
    await db.query(
      `WITH updated_balances AS (
        SELECT 
          id,
          SUM(income_amount - out_amount) OVER (ORDER BY id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS new_balance
        FROM cash_book_ledger
      )
      UPDATE cash_book_ledger c
      SET running_balance = u.new_balance, updated_at = NOW()
      FROM updated_balances u
      WHERE c.id = u.id AND c.id >= $1`,
      [startId]
    )
  }

  static async logTransaction(
    transactionDate: string,
    transactionType: string,
    name: string,
    paymentMethod: string,
    incomeAmount: number,
    outAmount: number,
    handledBy: string,
    referenceModule: string,
    referenceId: number,
    notes?: string | null,
    client?: any,
    foreignKeys?: CashBookForeignKeys
  ) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }

    // Derive physical foreign keys from reference module if not explicitly provided
    const fks: CashBookForeignKeys = {
      upad_id: foreignKeys?.upad_id ?? (referenceModule.toLowerCase() === 'upad' ? referenceId : null),
      salary_id: foreignKeys?.salary_id ?? (referenceModule.toLowerCase() === 'salary' ? referenceId : null),
      seth_payment_id: foreignKeys?.seth_payment_id ?? (referenceModule.toLowerCase() === 'seth payment' ? referenceId : null),
      income_id: foreignKeys?.income_id ?? (referenceModule.toLowerCase() === 'income' ? referenceId : null),
      expense_id: foreignKeys?.expense_id ?? (referenceModule.toLowerCase().startsWith('expense') ? referenceId : null),
      partner_id: foreignKeys?.partner_id ?? null
    }

    // Fetch latest entry for previous balance
    const latestRes = await db.query(
      'SELECT running_balance FROM cash_book_ledger ORDER BY id DESC LIMIT 1'
    )
    const prevBalance = parseFloat(latestRes.rows[0]?.running_balance || '0.00')
    const runningBalance = prevBalance + incomeAmount - outAmount

    const insertRes = await db.query(
      `INSERT INTO cash_book_ledger 
       (transaction_date, transaction_type, name, payment_method, income_amount, out_amount, running_balance, handled_by, reference_module, reference_id, upad_id, salary_id, seth_payment_id, income_id, expense_id, partner_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        transactionDate,
        transactionType,
        name,
        paymentMethod,
        incomeAmount,
        outAmount,
        runningBalance,
        handledBy,
        referenceModule,
        referenceId,
        fks.upad_id,
        fks.salary_id,
        fks.seth_payment_id,
        fks.income_id,
        fks.expense_id,
        fks.partner_id,
        notes || null
      ]
    )
    return insertRes.rows[0]
  }

  static async updateByReference(
    referenceModule: string,
    referenceId: number,
    data: {
      name?: string
      amount?: number
      paymentMethod?: string
      handledBy?: string
      transactionDate?: string
      notes?: string | null
      isIncome?: boolean
    },
    client?: any
  ) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }

    const findRes = await db.query(
      'SELECT * FROM cash_book_ledger WHERE reference_module ILIKE $1 AND reference_id = $2',
      [referenceModule, referenceId]
    )
    const entry = findRes.rows[0]
    if (!entry) return null

    const name = data.name !== undefined ? data.name : entry.name
    const paymentMethod = data.paymentMethod !== undefined ? data.paymentMethod : entry.payment_method
    const handledBy = data.handledBy !== undefined ? data.handledBy : entry.handled_by
    const transactionDate = data.transactionDate !== undefined ? data.transactionDate : entry.transaction_date
    const notes = data.notes !== undefined ? data.notes : entry.notes

    let incomeAmount = parseFloat(entry.income_amount)
    let outAmount = parseFloat(entry.out_amount)

    if (data.amount !== undefined) {
      if (data.isIncome) {
        incomeAmount = data.amount
        outAmount = 0
      } else {
        incomeAmount = 0
        outAmount = data.amount
      }
    }

    await db.query(
      `UPDATE cash_book_ledger 
       SET name = $1, payment_method = $2, handled_by = $3, transaction_date = $4, notes = $5, income_amount = $6, out_amount = $7, updated_at = NOW()
       WHERE id = $8`,
      [name, paymentMethod, handledBy, transactionDate, notes, incomeAmount, outAmount, entry.id]
    )

    await this.recalculateBalancesFrom(entry.id, client)

    const updatedRes = await db.query('SELECT * FROM cash_book_ledger WHERE id = $1', [entry.id])
    return updatedRes.rows[0]
  }

  static async deleteByReference(referenceModule: string, referenceId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }

    const findRes = await db.query(
      'SELECT id FROM cash_book_ledger WHERE reference_module ILIKE $1 AND reference_id = $2',
      [referenceModule, referenceId]
    )
    const entry = findRes.rows[0]
    if (!entry) return

    const entryId = entry.id
    await db.query('DELETE FROM cash_book_ledger WHERE id = $1', [entryId])

    // Notice: trg_cash_book_after_delete automatically runs on deletion, but we invoke recalculateBalancesFrom for transaction safety
    await this.recalculateBalancesFrom(entryId, client)
  }

  static async getByUpadId(upadId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    const res = await db.query('SELECT * FROM cash_book_ledger WHERE upad_id = $1', [upadId])
    return res.rows[0] || null
  }

  static async getBySalaryId(salaryId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    const res = await db.query('SELECT * FROM cash_book_ledger WHERE salary_id = $1', [salaryId])
    return res.rows[0] || null
  }

  static async getBySethPaymentId(sethPaymentId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    const res = await db.query('SELECT * FROM cash_book_ledger WHERE seth_payment_id = $1', [sethPaymentId])
    return res.rows[0] || null
  }

  static async getByIncomeId(incomeId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    const res = await db.query('SELECT * FROM cash_book_ledger WHERE income_id = $1', [incomeId])
    return res.rows[0] || null
  }

  static async getByExpenseId(expenseId: number, client?: any) {
    const db = client || { query: (text: string, params?: any[]) => query(text, params) }
    const res = await db.query('SELECT * FROM cash_book_ledger WHERE expense_id = $1', [expenseId])
    return res.rows[0] || null
  }

  static async getAll(filters: {
    transaction_type?: string
    payment_method?: string
    handled_by?: string
    date_from?: string
    date_to?: string
    search?: string
  }) {
    let sql = 'SELECT * FROM cash_book_ledger WHERE 1=1'
    const params: any[] = []

    if (filters.transaction_type) {
      params.push(filters.transaction_type)
      sql += ` AND transaction_type = $${params.length}`
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
      sql += ` AND transaction_date >= $${params.length}`
    }
    if (filters.date_to) {
      params.push(filters.date_to)
      sql += ` AND transaction_date <= $${params.length}`
    }
    if (filters.search) {
      params.push(`%${filters.search}%`)
      sql += ` AND (name ILIKE $${params.length} OR notes ILIKE $${params.length})`
    }

    sql += ' ORDER BY transaction_date DESC, id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  static async getDashboardSummary() {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const latestRes = await query('SELECT running_balance FROM cash_book_ledger ORDER BY id DESC LIMIT 1')
    const currentCashBalance = parseFloat(latestRes.rows[0]?.running_balance || '0.00')

    const todayInRes = await query('SELECT COALESCE(SUM(income_amount), 0) as total FROM cash_book_ledger WHERE transaction_date = $1', [today])
    const todayOutRes = await query('SELECT COALESCE(SUM(out_amount), 0) as total FROM cash_book_ledger WHERE transaction_date = $1', [today])

    const monthInRes = await query('SELECT COALESCE(SUM(income_amount), 0) as total FROM cash_book_ledger WHERE transaction_date >= $1', [startOfMonth])
    const monthOutRes = await query('SELECT COALESCE(SUM(out_amount), 0) as total FROM cash_book_ledger WHERE transaction_date >= $1', [startOfMonth])

    return {
      current_cash_balance: currentCashBalance,
      today_cash_in: parseFloat(todayInRes.rows[0]?.total || '0.00'),
      today_cash_out: parseFloat(todayOutRes.rows[0]?.total || '0.00'),
      monthly_cash_in: parseFloat(monthInRes.rows[0]?.total || '0.00'),
      monthly_cash_out: parseFloat(monthOutRes.rows[0]?.total || '0.00'),
    }
  }
}
