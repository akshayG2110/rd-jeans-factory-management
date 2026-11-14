import { getMongoDb, getNextSequence } from '../mongodb'

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
   * Recalculate running balances forward from startId
   */
  static async recalculateBalancesFrom(startId: number) {
    const db = await getMongoDb()
    const entries = await db.collection('cash_book_ledger').find({}).sort({ id: 1 }).toArray()
    let running = 0
    for (const entry of entries) {
      running += (Number(entry.income_amount) || 0) - (Number(entry.out_amount) || 0)
      if (entry.id >= startId && entry.running_balance !== running) {
        await db.collection('cash_book_ledger').updateOne(
          { _id: entry._id },
          { $set: { running_balance: running, updated_at: new Date().toISOString() } }
        )
      }
    }
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
    _client?: any,
    foreignKeys?: CashBookForeignKeys
  ) {
    const db = await getMongoDb()

    // Derive physical foreign keys
    const fks: CashBookForeignKeys = {
      upad_id: foreignKeys?.upad_id ?? (referenceModule.toLowerCase() === 'upad' ? referenceId : null),
      salary_id: foreignKeys?.salary_id ?? (referenceModule.toLowerCase() === 'salary' ? referenceId : null),
      seth_payment_id: foreignKeys?.seth_payment_id ?? (referenceModule.toLowerCase() === 'seth payment' ? referenceId : null),
      income_id: foreignKeys?.income_id ?? (referenceModule.toLowerCase() === 'income' ? referenceId : null),
      expense_id: foreignKeys?.expense_id ?? (referenceModule.toLowerCase().startsWith('expense') ? referenceId : null),
      partner_id: foreignKeys?.partner_id ?? null
    }

    // Fetch previous latest entry
    const latest = await db.collection('cash_book_ledger').find({}).sort({ id: -1 }).limit(1).toArray()
    const prevBalance = Number(latest[0]?.running_balance || 0)
    const runningBalance = prevBalance + (Number(incomeAmount) || 0) - (Number(outAmount) || 0)

    const id = await getNextSequence('cash_book_ledger')
    const now = new Date().toISOString()

    const newEntry = {
      id,
      transaction_date: transactionDate,
      transaction_type: transactionType,
      name,
      payment_method: paymentMethod,
      income_amount: Number(incomeAmount) || 0,
      out_amount: Number(outAmount) || 0,
      running_balance: runningBalance,
      handled_by: handledBy,
      reference_module: referenceModule,
      reference_id: referenceId,
      upad_id: fks.upad_id,
      salary_id: fks.salary_id,
      seth_payment_id: fks.seth_payment_id,
      income_id: fks.income_id,
      expense_id: fks.expense_id,
      partner_id: fks.partner_id,
      notes: notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('cash_book_ledger').insertOne(newEntry)
    const { _id, ...rest } = newEntry as any
    return rest
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
    _client?: any
  ) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({
      reference_module: { $regex: `^${referenceModule}$`, $options: 'i' },
      reference_id: Number(referenceId)
    })
    if (!entry) return null

    const name = data.name !== undefined ? data.name : entry.name
    const paymentMethod = data.paymentMethod !== undefined ? data.paymentMethod : entry.payment_method
    const handledBy = data.handledBy !== undefined ? data.handledBy : entry.handled_by
    const transactionDate = data.transactionDate !== undefined ? data.transactionDate : entry.transaction_date
    const notes = data.notes !== undefined ? data.notes : entry.notes

    let incomeAmount = Number(entry.income_amount) || 0
    let outAmount = Number(entry.out_amount) || 0

    if (data.amount !== undefined) {
      if (data.isIncome) {
        incomeAmount = Number(data.amount)
        outAmount = 0
      } else {
        incomeAmount = 0
        outAmount = Number(data.amount)
      }
    }

    await db.collection('cash_book_ledger').updateOne(
      { id: entry.id },
      {
        $set: {
          name,
          payment_method: paymentMethod,
          handled_by: handledBy,
          transaction_date: transactionDate,
          notes,
          income_amount: incomeAmount,
          out_amount: outAmount,
          updated_at: new Date().toISOString()
        }
      }
    )

    await this.recalculateBalancesFrom(entry.id)

    const updated = await db.collection('cash_book_ledger').findOne({ id: entry.id })
    const { _id, ...rest } = updated as any
    return rest
  }

  static async deleteByReference(referenceModule: string, referenceId: number, _client?: any) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({
      reference_module: { $regex: `^${referenceModule}$`, $options: 'i' },
      reference_id: Number(referenceId)
    })
    if (!entry) return

    const entryId = entry.id
    await db.collection('cash_book_ledger').deleteOne({ id: entryId })
    await this.recalculateBalancesFrom(entryId)
  }

  static async getByUpadId(upadId: number) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({ upad_id: Number(upadId) })
    if (!entry) return null
    const { _id, ...rest } = entry
    return rest
  }

  static async getBySalaryId(salaryId: number) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({ salary_id: Number(salaryId) })
    if (!entry) return null
    const { _id, ...rest } = entry
    return rest
  }

  static async getBySethPaymentId(sethPaymentId: number) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({ seth_payment_id: Number(sethPaymentId) })
    if (!entry) return null
    const { _id, ...rest } = entry
    return rest
  }

  static async getByIncomeId(incomeId: number) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({ income_id: Number(incomeId) })
    if (!entry) return null
    const { _id, ...rest } = entry
    return rest
  }

  static async getByExpenseId(expenseId: number) {
    const db = await getMongoDb()
    const entry = await db.collection('cash_book_ledger').findOne({ expense_id: Number(expenseId) })
    if (!entry) return null
    const { _id, ...rest } = entry
    return rest
  }

  static async getAll(filters: {
    transaction_type?: string
    payment_method?: string
    handled_by?: string
    date_from?: string
    date_to?: string
    search?: string
  }) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (filters.transaction_type) {
      queryFilter.transaction_type = filters.transaction_type
    }
    if (filters.payment_method) {
      queryFilter.payment_method = filters.payment_method
    }
    if (filters.handled_by) {
      queryFilter.handled_by = filters.handled_by
    }
    if (filters.date_from || filters.date_to) {
      queryFilter.transaction_date = {}
      if (filters.date_from) queryFilter.transaction_date.$gte = filters.date_from
      if (filters.date_to) queryFilter.transaction_date.$lte = filters.date_to
    }
    if (filters.search) {
      queryFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const records = await db
      .collection('cash_book_ledger')
      .find(queryFilter)
      .sort({ transaction_date: -1, id: -1 })
      .toArray()

    return records.map(({ _id, ...rest }) => rest)
  }

  static async getDashboardSummary() {
    const db = await getMongoDb()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const latest = await db.collection('cash_book_ledger').find({}).sort({ id: -1 }).limit(1).toArray()
    const currentCashBalance = Number(latest[0]?.running_balance || 0)

    const allRecords = await db.collection('cash_book_ledger').find({}).toArray()

    let todayIn = 0
    let todayOut = 0
    let monthIn = 0
    let monthOut = 0

    for (const r of allRecords) {
      const inc = Number(r.income_amount) || 0
      const out = Number(r.out_amount) || 0
      if (r.transaction_date === today) {
        todayIn += inc
        todayOut += out
      }
      if (r.transaction_date >= startOfMonth) {
        monthIn += inc
        monthOut += out
      }
    }

    return {
      current_cash_balance: currentCashBalance,
      today_cash_in: todayIn,
      today_cash_out: todayOut,
      monthly_cash_in: monthIn,
      monthly_cash_out: monthOut
    }
  }
}
