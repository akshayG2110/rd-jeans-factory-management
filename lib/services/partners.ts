import { query, getClient } from '../db'
import { CashBookService } from './cashbook'

export interface PartnerRecord {
  id: number
  name: string
  mobile_number?: string | null
  profit_share_percentage: number
  opening_balance: number | string
  current_balance: number | string
  status: 'Active' | 'Inactive'
  notes?: string | null
  created_at: string
  updated_at: string
  total_invested?: number
  total_drawings?: number
  equity_balance?: number
  cash_in_handled?: number
  cash_out_handled?: number
  net_cash_handled?: number
}

export interface PartnerTransactionRecord {
  id: number
  partner_id: number
  partner_name?: string
  transaction_date: string
  transaction_type: 'Capital Investment' | 'Drawing (Personal Withdrawal)' | 'Profit Share' | 'Cash Transfer' | 'Adjustment'
  amount: number | string
  payment_method: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export class PartnerService {
  /**
   * Get all partners with dynamically calculated capital equity and cash handling stats
   */
  static async getAll() {
    const partnersRes = await query('SELECT * FROM partners ORDER BY id ASC')
    const partners: PartnerRecord[] = partnersRes.rows

    const enriched = await Promise.all(
      partners.map(async (p) => {
        // 1. Calculate Capital Equity from partner_transactions
        const txRes = await query(
          `SELECT 
             COALESCE(SUM(CASE WHEN transaction_type IN ('Capital Investment', 'Profit Share') THEN amount ELSE 0 END), 0) as invested,
             COALESCE(SUM(CASE WHEN transaction_type IN ('Drawing (Personal Withdrawal)') THEN amount ELSE 0 END), 0) as drawings
           FROM partner_transactions 
           WHERE partner_id = $1`,
          [p.id]
        )
        const totalInvested = parseFloat(txRes.rows[0]?.invested || '0')
        const totalDrawings = parseFloat(txRes.rows[0]?.drawings || '0')
        const openingBalance = parseFloat(String(p.opening_balance || '0'))
        const equityBalance = openingBalance + totalInvested - totalDrawings

        // 2. Calculate Operational Cash Handled from cash_book_ledger
        const cashRes = await query(
          `SELECT 
             COALESCE(SUM(income_amount), 0) as cash_in,
             COALESCE(SUM(out_amount), 0) as cash_out
           FROM cash_book_ledger 
           WHERE partner_id = $1 OR handled_by ILIKE $2`,
          [p.id, `%${p.name}%`]
        )
        const cashIn = parseFloat(cashRes.rows[0]?.cash_in || '0')
        const cashOut = parseFloat(cashRes.rows[0]?.cash_out || '0')

        return {
          ...p,
          total_invested: totalInvested,
          total_drawings: totalDrawings,
          equity_balance: equityBalance,
          cash_in_handled: cashIn,
          cash_out_handled: cashOut,
          net_cash_handled: cashIn - cashOut
        }
      })
    )

    return enriched
  }

  static async getById(id: number) {
    const res = await query('SELECT * FROM partners WHERE id = $1', [id])
    if (res.rows.length === 0) return null

    const p = res.rows[0]
    const txRes = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN transaction_type IN ('Capital Investment', 'Profit Share') THEN amount ELSE 0 END), 0) as invested,
         COALESCE(SUM(CASE WHEN transaction_type IN ('Drawing (Personal Withdrawal)') THEN amount ELSE 0 END), 0) as drawings
       FROM partner_transactions 
       WHERE partner_id = $1`,
      [p.id]
    )
    const totalInvested = parseFloat(txRes.rows[0]?.invested || '0')
    const totalDrawings = parseFloat(txRes.rows[0]?.drawings || '0')
    const openingBalance = parseFloat(String(p.opening_balance || '0'))
    const equityBalance = openingBalance + totalInvested - totalDrawings

    const cashRes = await query(
      `SELECT 
         COALESCE(SUM(income_amount), 0) as cash_in,
         COALESCE(SUM(out_amount), 0) as cash_out
       FROM cash_book_ledger 
       WHERE partner_id = $1 OR handled_by ILIKE $2`,
      [p.id, `%${p.name}%`]
    )
    const cashIn = parseFloat(cashRes.rows[0]?.cash_in || '0')
    const cashOut = parseFloat(cashRes.rows[0]?.cash_out || '0')

    const transactions = await this.getPartnerTransactions(p.id)

    return {
      ...p,
      total_invested: totalInvested,
      total_drawings: totalDrawings,
      equity_balance: equityBalance,
      cash_in_handled: cashIn,
      cash_out_handled: cashOut,
      net_cash_handled: cashIn - cashOut,
      transactions
    }
  }

  static async getByName(name: string) {
    const res = await query('SELECT id FROM partners WHERE name ILIKE $1 LIMIT 1', [name])
    if (res.rows.length === 0) return null
    return this.getById(res.rows[0].id)
  }

  static async create(data: {
    name: string
    mobile_number?: string | null
    profit_share_percentage?: number
    opening_balance?: number
    status?: 'Active' | 'Inactive'
    notes?: string | null
  }) {
    const name = data.name.trim()
    const profitShare = data.profit_share_percentage !== undefined ? data.profit_share_percentage : 50.00
    const openingBal = data.opening_balance !== undefined ? data.opening_balance : 0.00
    const status = data.status || 'Active'

    const res = await query(
      `INSERT INTO partners 
       (name, mobile_number, profit_share_percentage, opening_balance, current_balance, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        data.mobile_number || null,
        profitShare,
        openingBal,
        openingBal,
        status,
        data.notes || null
      ]
    )

    return await this.getById(res.rows[0].id)
  }

  static async update(
    id: number,
    data: Partial<{
      name: string
      mobile_number: string | null
      profit_share_percentage: number
      opening_balance: number
      status: 'Active' | 'Inactive'
      notes: string | null
    }>
  ) {
    const existing = await query('SELECT * FROM partners WHERE id = $1', [id])
    if (existing.rows.length === 0) return null

    const p = existing.rows[0]
    const name = data.name !== undefined ? data.name.trim() : p.name
    const mobile_number = data.mobile_number !== undefined ? data.mobile_number : p.mobile_number
    const profit_share_percentage = data.profit_share_percentage !== undefined ? data.profit_share_percentage : p.profit_share_percentage
    const opening_balance = data.opening_balance !== undefined ? data.opening_balance : p.opening_balance
    const status = data.status !== undefined ? data.status : p.status
    const notes = data.notes !== undefined ? data.notes : p.notes

    await query(
      `UPDATE partners 
       SET name = $1, mobile_number = $2, profit_share_percentage = $3, 
           opening_balance = $4, status = $5, notes = $6, updated_at = NOW()
       WHERE id = $7`,
      [name, mobile_number, profit_share_percentage, opening_balance, status, notes, id]
    )

    return await this.getById(id)
  }

  static async delete(id: number) {
    const existing = await this.getById(id)
    if (!existing) return null

    await query('DELETE FROM partners WHERE id = $1', [id])
    return existing
  }

  /**
   * Log Capital Transaction (Investment, Drawing, Profit Share)
   */
  static async logTransaction(data: {
    partner_id: number
    transaction_date: string
    transaction_type: 'Capital Investment' | 'Drawing (Personal Withdrawal)' | 'Profit Share' | 'Cash Transfer' | 'Adjustment'
    amount: number
    payment_method?: string
    notes?: string | null
    sync_cashbook?: boolean
  }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const partnerRes = await client.query('SELECT * FROM partners WHERE id = $1', [data.partner_id])
      if (partnerRes.rows.length === 0) {
        throw new Error(`Partner with ID ${data.partner_id} does not exist.`)
      }
      const partner = partnerRes.rows[0]

      const paymentMethod = data.payment_method || 'Cash'

      // 1. Insert into partner_transactions
      const insRes = await client.query(
        `INSERT INTO partner_transactions 
         (partner_id, transaction_date, transaction_type, amount, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.partner_id,
          data.transaction_date,
          data.transaction_type,
          data.amount,
          paymentMethod,
          data.notes || null
        ]
      )
      const tx = insRes.rows[0]

      // 2. Optionally sync with cashbook ledger if actual factory cash was infused or withdrawn
      if (data.sync_cashbook !== false) {
        const isInvestment = data.transaction_type === 'Capital Investment'
        const isDrawing = data.transaction_type === 'Drawing (Personal Withdrawal)'

        if (isInvestment) {
          await CashBookService.logTransaction(
            data.transaction_date,
            'Money In',
            `Capital Infusion (${partner.name})`,
            paymentMethod,
            data.amount,
            0,
            partner.name,
            'Partner Capital',
            tx.id,
            data.notes || `Capital investment by ${partner.name}`,
            client,
            { partner_id: data.partner_id }
          )
        } else if (isDrawing) {
          await CashBookService.logTransaction(
            data.transaction_date,
            'Money Out',
            `Partner Drawing (${partner.name})`,
            paymentMethod,
            0,
            data.amount,
            partner.name,
            'Partner Drawing',
            tx.id,
            data.notes || `Personal drawing by ${partner.name}`,
            client,
            { partner_id: data.partner_id }
          )
        }
      }

      // 3. Update partner's current balance
      const balanceRes = await client.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN transaction_type IN ('Capital Investment', 'Profit Share') THEN amount ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN transaction_type IN ('Drawing (Personal Withdrawal)') THEN amount ELSE 0 END), 0) as net
         FROM partner_transactions
         WHERE partner_id = $1`,
        [data.partner_id]
      )
      const newBal = parseFloat(partner.opening_balance || '0') + parseFloat(balanceRes.rows[0]?.net || '0')
      await client.query('UPDATE partners SET current_balance = $1, updated_at = NOW() WHERE id = $2', [newBal, data.partner_id])

      await client.query('COMMIT')
      return tx
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  /**
   * Get all equity transactions from partner_transactions
   */
  static async getPartnerTransactions(partnerId?: number) {
    let sql = `
      SELECT pt.*, p.name as partner_name
      FROM partner_transactions pt
      JOIN partners p ON pt.partner_id = p.id
      WHERE 1=1
    `
    const params: any[] = []
    if (partnerId) {
      params.push(partnerId)
      sql += ` AND pt.partner_id = $${params.length}`
    }
    sql += ' ORDER BY pt.transaction_date DESC, pt.id DESC'
    const res = await query(sql, params)
    return res.rows
  }

  /**
   * Dynamic summary for partners
   */
  static async getSummary() {
    const partners = await this.getAll()

    // For backwards compatibility with legacy properties
    const raju = partners.find(p => p.name.toLowerCase().includes('raju'))
    const dhruvesh = partners.find(p => p.name.toLowerCase().includes('dhruvesh'))

    return {
      partners,
      total_partners: partners.length,
      total_equity: partners.reduce((sum, p) => sum + (p.equity_balance || 0), 0),
      total_invested: partners.reduce((sum, p) => sum + (p.total_invested || 0), 0),
      total_drawings: partners.reduce((sum, p) => sum + (p.total_drawings || 0), 0),
      // Legacy fields
      rajubhai_total_income_handled: raju?.cash_in_handled || 0,
      rajubhai_total_expenses_handled: raju?.cash_out_handled || 0,
      dhruveshbhai_total_income_handled: dhruvesh?.cash_in_handled || 0,
      dhruveshbhai_total_expenses_handled: dhruvesh?.cash_out_handled || 0,
    }
  }

  /**
   * Get operational cashbook transactions handled by partner (maintains passbook view compatibility)
   */
  static async getTransactions(partnerName?: string) {
    let sql = `
      SELECT c.*, p.name as partner_name
      FROM cash_book_ledger c
      LEFT JOIN partners p ON c.partner_id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (partnerName && partnerName.toLowerCase() !== 'all') {
      params.push(`%${partnerName}%`)
      sql += ` AND (c.handled_by ILIKE $${params.length} OR p.name ILIKE $${params.length})`
    }

    sql += ' ORDER BY c.transaction_date DESC, c.id DESC'
    const res = await query(sql, params)
    return res.rows
  }
}
