import { getMongoDb, getNextSequence } from '../mongodb'
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
  transactions?: any[]
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
  static async getAll(): Promise<PartnerRecord[]> {
    const db = await getMongoDb()
    const partners = await db.collection('partners').find({}).sort({ id: 1 }).toArray()
    const allTx = await db.collection('partner_transactions').find({}).toArray()
    const allCash = await db.collection('cash_book_ledger').find({}).toArray()

    return partners.map(p => {
      const { _id, ...rest } = p
      const pTx = allTx.filter(t => t.partner_id === p.id)
      let totalInvested = 0
      let totalDrawings = 0

      for (const t of pTx) {
        const amt = Number(t.amount) || 0
        if (t.transaction_type === 'Capital Investment' || t.transaction_type === 'Profit Share') {
          totalInvested += amt
        } else if (t.transaction_type === 'Drawing (Personal Withdrawal)') {
          totalDrawings += amt
        }
      }

      const openingBalance = Number(p.opening_balance || 0)
      const equityBalance = openingBalance + totalInvested - totalDrawings

      let cashIn = 0
      let cashOut = 0

      for (const c of allCash) {
        const matchesPartner = c.partner_id === p.id || (c.handled_by && c.handled_by.toLowerCase().includes(p.name.toLowerCase()))
        if (matchesPartner) {
          cashIn += Number(c.income_amount) || 0
          cashOut += Number(c.out_amount) || 0
        }
      }

      return {
        id: Number(p.id),
        name: String(p.name),
        mobile_number: p.mobile_number || null,
        profit_share_percentage: Number(p.profit_share_percentage || 50),
        opening_balance: Number(p.opening_balance || 0),
        current_balance: Number(p.current_balance || 0),
        status: (p.status || 'Active') as 'Active' | 'Inactive',
        notes: p.notes || null,
        created_at: String(p.created_at || ''),
        updated_at: String(p.updated_at || ''),
        total_invested: totalInvested,
        total_drawings: totalDrawings,
        equity_balance: equityBalance,
        cash_in_handled: cashIn,
        cash_out_handled: cashOut,
        net_cash_handled: cashIn - cashOut
      }
    })
  }

  static async getById(id: number): Promise<PartnerRecord | null> {
    const db = await getMongoDb()
    const numId = Number(id)
    const partner = await db.collection('partners').findOne({ id: numId })
    if (!partner) return null

    const all = await this.getAll()
    const enriched = all.find(p => p.id === numId)
    if (!enriched) return null
    const transactions = await this.getPartnerTransactions(numId)

    return {
      ...enriched,
      transactions
    }
  }

  static async getByName(name: string) {
    const db = await getMongoDb()
    const partner = await db.collection('partners').findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
    if (!partner) return null
    return this.getById(partner.id)
  }

  static async create(data: {
    name: string
    mobile_number?: string | null
    profit_share_percentage?: number
    opening_balance?: number
    status?: 'Active' | 'Inactive'
    notes?: string | null
  }) {
    const db = await getMongoDb()
    const id = await getNextSequence('partners')
    const now = new Date().toISOString()
    const openingBal = Number(data.opening_balance || 0)

    const newPartner = {
      id,
      name: data.name.trim(),
      mobile_number: data.mobile_number || null,
      profit_share_percentage: data.profit_share_percentage !== undefined ? Number(data.profit_share_percentage) : 50,
      opening_balance: openingBal,
      current_balance: openingBal,
      status: data.status || 'Active',
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('partners').insertOne(newPartner)
    return await this.getById(id)
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
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('partners').findOne({ id: numId })
    if (!existing) return null

    const updateFields: any = {
      updated_at: new Date().toISOString()
    }
    if (data.name !== undefined) updateFields.name = data.name.trim()
    if (data.mobile_number !== undefined) updateFields.mobile_number = data.mobile_number
    if (data.profit_share_percentage !== undefined) updateFields.profit_share_percentage = Number(data.profit_share_percentage)
    if (data.opening_balance !== undefined) updateFields.opening_balance = Number(data.opening_balance)
    if (data.status !== undefined) updateFields.status = data.status
    if (data.notes !== undefined) updateFields.notes = data.notes

    await db.collection('partners').updateOne({ id: numId }, { $set: updateFields })
    return await this.getById(numId)
  }

  static async delete(id: number) {
    const existing = await this.getById(id)
    if (!existing) return null

    const db = await getMongoDb()
    const numId = Number(id)
    await Promise.all([
      db.collection('partners').deleteOne({ id: numId }),
      db.collection('partner_transactions').deleteMany({ partner_id: numId })
    ])
    return existing
  }

  static async logTransaction(data: {
    partner_id: number
    transaction_date: string
    transaction_type: 'Capital Investment' | 'Drawing (Personal Withdrawal)' | 'Profit Share' | 'Cash Transfer' | 'Adjustment'
    amount: number
    payment_method?: string
    notes?: string | null
    sync_cashbook?: boolean
  }) {
    const db = await getMongoDb()
    const numPartnerId = Number(data.partner_id)
    const partner = await db.collection('partners').findOne({ id: numPartnerId })
    if (!partner) {
      throw new Error(`Partner with ID ${numPartnerId} does not exist.`)
    }

    const id = await getNextSequence('partner_transactions')
    const now = new Date().toISOString()
    const paymentMethod = data.payment_method || 'Cash'

    const tx = {
      id,
      partner_id: numPartnerId,
      transaction_date: data.transaction_date,
      transaction_type: data.transaction_type,
      amount: Number(data.amount),
      payment_method: paymentMethod,
      notes: data.notes || null,
      created_at: now,
      updated_at: now
    }

    await db.collection('partner_transactions').insertOne(tx)

    if (data.sync_cashbook !== false) {
      const isInvestment = data.transaction_type === 'Capital Investment'
      const isDrawing = data.transaction_type === 'Drawing (Personal Withdrawal)'

      if (isInvestment) {
        await CashBookService.logTransaction(
          data.transaction_date,
          'Money In',
          `Capital Infusion (${partner.name})`,
          paymentMethod,
          Number(data.amount),
          0,
          partner.name,
          'Partner Capital',
          tx.id,
          data.notes || `Capital investment by ${partner.name}`,
          undefined,
          { partner_id: numPartnerId }
        )
      } else if (isDrawing) {
        await CashBookService.logTransaction(
          data.transaction_date,
          'Money Out',
          `Partner Drawing (${partner.name})`,
          paymentMethod,
          0,
          Number(data.amount),
          partner.name,
          'Partner Drawing',
          tx.id,
          data.notes || `Personal drawing by ${partner.name}`,
          undefined,
          { partner_id: numPartnerId }
        )
      }
    }

    const { _id, ...rest } = tx as any
    return rest
  }

  static async getPartnerTransactions(partnerId?: number) {
    const db = await getMongoDb()
    const queryFilter: any = {}
    if (partnerId) queryFilter.partner_id = Number(partnerId)

    const txs = await db.collection('partner_transactions').find(queryFilter).sort({ transaction_date: -1, id: -1 }).toArray()
    const partners = await db.collection('partners').find({}).toArray()
    const pMap = new Map(partners.map(p => [p.id, p.name]))

    return txs.map(t => {
      const { _id, ...rest } = t
      return {
        ...rest,
        partner_name: pMap.get(t.partner_id) || ''
      }
    })
  }

  static async getSummary() {
    const partners = await this.getAll()
    const raju = partners.find(p => p.name.toLowerCase().includes('raju'))
    const dhruvesh = partners.find(p => p.name.toLowerCase().includes('dhruvesh'))

    return {
      partners,
      total_partners: partners.length,
      total_equity: partners.reduce((sum, p) => sum + (p.equity_balance || 0), 0),
      total_invested: partners.reduce((sum, p) => sum + (p.total_invested || 0), 0),
      total_drawings: partners.reduce((sum, p) => sum + (p.total_drawings || 0), 0),
      rajubhai_total_income_handled: raju?.cash_in_handled || 0,
      rajubhai_total_expenses_handled: raju?.cash_out_handled || 0,
      dhruveshbhai_total_income_handled: dhruvesh?.cash_in_handled || 0,
      dhruveshbhai_total_expenses_handled: dhruvesh?.cash_out_handled || 0
    }
  }

  static async getTransactions(partnerName?: string) {
    const db = await getMongoDb()
    const partners = await db.collection('partners').find({}).toArray()
    const pMap = new Map(partners.map(p => [p.id, p.name]))

    const all = await db.collection('cash_book_ledger').find({}).sort({ transaction_date: -1, id: -1 }).toArray()

    const filtered = partnerName && partnerName.toLowerCase() !== 'all'
      ? all.filter(c => {
          const pName = c.partner_id ? pMap.get(c.partner_id) : ''
          return (
            (c.handled_by && c.handled_by.toLowerCase().includes(partnerName.toLowerCase())) ||
            (pName && pName.toLowerCase().includes(partnerName.toLowerCase()))
          )
        })
      : all

    return filtered.map(c => {
      const { _id, ...rest } = c
      return {
        ...rest,
        partner_name: c.partner_id ? pMap.get(c.partner_id) || '' : ''
      }
    })
  }
}
