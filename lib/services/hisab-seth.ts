import { getMongoDb, getNextSequence } from '../mongodb'
import { CashBookService } from './cashbook'
import { GoogleSheetsService } from './google-sheets'
import ExcelJS from 'exceljs'

export interface SethHisabLot {
  cutting_id: number
  lot_number: string
  cutting_date: string
  roll_id: number
  roll_number: string
  fabric_type: string
  meter_used: number
  piece_count: number
  stitching_status: string
  rate_per_piece: number
  amount: number
  average?: number | null
}

export interface SethHisabRecord {
  id: number
  hisab_number: string
  seth_id: number
  seth_name: string
  hisab_date: string
  lots: SethHisabLot[]
  total_pieces: number
  total_meter_used: number
  average_consumption: number
  stitching_amount: number
  extra_charges: number
  extra_charges_notes?: string | null
  deductions: number
  deductions_notes?: string | null
  total_amount: number
  paid_amount: number
  balance_amount: number
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid'
  payment_method: string
  handled_by: string
  notes?: string | null
  linked_payment_id?: number | null
  created_at: string
  updated_at: string
}

export class SethHisabService {
  /**
   * Aggregates the factory workflow for Seths:
   * Rolls received -> Cutting lots made -> Stitching progress -> Ready for Hisab
   */
  static async getWorkOverview(sethId?: number) {
    const db = await getMongoDb()
    const numSethId = sethId ? Number(sethId) : undefined

    const sethsQuery = numSethId ? { id: numSethId } : {}
    const seths = await db.collection('seths').find(sethsQuery).sort({ seth_name: 1 }).toArray()
    const sethMap = new Map(seths.map(s => [s.id, s]))

    // Fetch all rolls
    const rollsQuery = numSethId ? { seth_id: numSethId } : {}
    const rolls = await db.collection('rolls').find(rollsQuery).sort({ id: -1 }).toArray()
    const rollMap = new Map(rolls.map(r => [r.id, r]))

    // Fetch cutting entries
    let cuttingEntries: any[] = []
    if (numSethId) {
      const sethRollIds = rolls.map(r => r.id)
      cuttingEntries = await db
        .collection('cutting_entries')
        .find({ roll_id: { $in: sethRollIds } })
        .sort({ cutting_date: -1, id: -1 })
        .toArray()
    } else {
      cuttingEntries = await db.collection('cutting_entries').find({}).sort({ cutting_date: -1, id: -1 }).toArray()
    }

    // Fetch all finished goods
    const finishedGoods = await db.collection('finished_goods').find({}).toArray()
    const fgMap = new Map(finishedGoods.map(fg => [fg.cutting_id, fg]))

    // Fetch seth hisabs to know settled lots
    const hisabs = await db.collection('seth_hisabs').find(numSethId ? { seth_id: numSethId } : {}).toArray()

    // Fetch seth payments
    const payments = await db.collection('seth_payments').find(numSethId ? { seth_id: numSethId } : {}).toArray()

    // Enrich cutting entries with roll info, stitching status, and settled hisab status
    const enrichedLots = cuttingEntries.map(c => {
      const roll = rollMap.get(c.roll_id)
      const seth = roll ? sethMap.get(roll.seth_id) : null
      const fg = fgMap.get(c.id)

      const status = fg?.status || 'Cut'
      const totalPieces = Number(c.piece_count || fg?.total_pieces || 0)
      const stitchingPieces = Number(fg?.stitching_pieces || 0)
      const finishedPieces = Number(fg?.finished_pieces || 0)
      const rejectedPieces = Number(fg?.rejected_pieces || 0)

      // Stitching is considered complete if status is Ready/Washing/Dispatched/Closed or finished >= total
      const isStitchingCompleted =
        status === 'Ready' ||
        status === 'Washing' ||
        status === 'Dispatched' ||
        status === 'Closed' ||
        (finishedPieces > 0 && finishedPieces + rejectedPieces >= totalPieces)

      const isSettled = Boolean(c.hisab_id || fg?.hisab_id)

      return {
        id: c.id,
        cutting_id: c.id,
        lot_number: c.lot_number,
        cutting_date: c.cutting_date,
        roll_id: c.roll_id,
        roll_number: roll?.roll_number || c.roll_number || `Roll #${c.roll_id}`,
        fabric_type: roll?.fabric_type || c.fabric_type || 'Denim Fabric',
        seth_id: roll?.seth_id || c.seth_id,
        seth_name: seth?.seth_name || c.seth_name || 'Seth Client',
        meter_used: Number(c.meter_used || 0),
        piece_count: totalPieces,
        size: c.size,
        average: c.average !== null && c.average !== undefined ? Number(c.average) : (totalPieces > 0 ? Number((Number(c.meter_used) / totalPieces).toFixed(2)) : null),
        stitching_status: status,
        stitching_pieces: stitchingPieces,
        finished_pieces: finishedPieces,
        rejected_pieces: rejectedPieces,
        is_stitching_completed: isStitchingCompleted,
        is_settled: isSettled,
        hisab_id: c.hisab_id || fg?.hisab_id || null,
        hisab_number: c.hisab_number || fg?.hisab_number || null,
        notes: c.notes || fg?.notes || null
      }
    })

    const readyLots = enrichedLots.filter(l => l.is_stitching_completed && !l.is_settled)
    const inStitchingLots = enrichedLots.filter(l => !l.is_stitching_completed && !l.is_settled)
    const settledLots = enrichedLots.filter(l => l.is_settled)

    // Seth summary stats
    const totalRolls = rolls.length
    const totalFabricReceived = rolls.reduce((sum, r) => sum + (Number(r.received_meter) || 0), 0)
    const totalFabricUsed = rolls.reduce((sum, r) => sum + (Number(r.used_meter) || 0), 0)
    const totalFabricRemaining = rolls.reduce((sum, r) => sum + (Number(r.remaining_meter) || 0), 0)

    const totalHisabsAmount = hisabs.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
    const totalHisabsPaid = hisabs.reduce((sum, h) => sum + (Number(h.paid_amount) || 0), 0)
    const totalHisabsBalance = hisabs.reduce((sum, h) => sum + (Number(h.balance_amount) || 0), 0)

    return {
      seths: seths.map(({ _id, ...s }) => s),
      rolls: rolls.map(({ _id, ...r }) => ({
        id: r.id,
        roll_number: r.roll_number,
        short_number: r.short_number,
        seth_id: r.seth_id,
        seth_name: sethMap.get(r.seth_id)?.seth_name || '',
        fabric_type: r.fabric_type,
        received_meter: Number(r.received_meter || 0),
        used_meter: Number(r.used_meter || 0),
        remaining_meter: Number(r.remaining_meter || 0),
        status: r.status,
        entry_date: r.entry_date,
        notes: r.notes
      })),
      lots: enrichedLots,
      readyLots,
      inStitchingLots,
      settledLots,
      summary: {
        totalRolls,
        totalFabricReceived,
        totalFabricUsed,
        totalFabricRemaining,
        readyLotsCount: readyLots.length,
        inStitchingCount: inStitchingLots.length,
        settledLotsCount: settledLots.length,
        totalCuttingLots: enrichedLots.length,
        totalPiecesCut: enrichedLots.reduce((sum, l) => sum + l.piece_count, 0),
        totalHisabsAmount,
        totalHisabsPaid,
        totalHisabsBalance,
        totalPaymentsReceived: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      }
    }
  }

  /**
   * Fetch all Seth Hisab records
   */
  static async getAll(filters?: { seth_id?: number; payment_status?: string; search?: string }) {
    const db = await getMongoDb()
    const query: any = {}

    if (filters?.seth_id) {
      query.seth_id = Number(filters.seth_id)
    }

    if (filters?.payment_status && filters.payment_status !== 'all') {
      query.payment_status = filters.payment_status
    }

    if (filters?.search) {
      query.$or = [
        { hisab_number: { $regex: filters.search, $options: 'i' } },
        { seth_name: { $regex: filters.search, $options: 'i' } },
        { handled_by: { $regex: filters.search, $options: 'i' } }
      ]
    }

    const records = await db.collection('seth_hisabs').find(query).sort({ hisab_date: -1, id: -1 }).toArray()
    return records.map(({ _id, ...rest }) => rest)
  }

  /**
   * Get single Hisab record with full details
   */
  static async getById(id: number): Promise<SethHisabRecord | null> {
    const db = await getMongoDb()
    const numId = Number(id)
    const hisab = await db.collection('seth_hisabs').findOne({ id: numId })
    if (!hisab) return null

    const seth = await db.collection('seths').findOne({ id: hisab.seth_id })
    const { _id, ...rest } = hisab

    return {
      ...rest,
      seth_name: seth?.seth_name || rest.seth_name || 'Seth Client'
    } as SethHisabRecord
  }

  /**
   * Create a new Seth Hisab settlement
   */
  static async create(data: {
    seth_id: number
    hisab_date?: string
    lots: SethHisabLot[]
    extra_charges?: number
    extra_charges_notes?: string | null
    deductions?: number
    deductions_notes?: string | null
    paid_amount?: number
    payment_method?: string
    handled_by?: string
    notes?: string | null
  }) {
    const db = await getMongoDb()
    const numSethId = Number(data.seth_id)
    const seth = await db.collection('seths').findOne({ id: numSethId })
    if (!seth) {
      throw new Error(`Seth with ID ${numSethId} not found`)
    }

    if (!data.lots || data.lots.length === 0) {
      throw new Error('At least one completed cutting lot must be selected for Hisab')
    }

    const id = await getNextSequence('seth_hisabs')
    const hisabDate = data.hisab_date || new Date().toISOString().split('T')[0]
    const year = new Date(hisabDate).getFullYear() || 2026
    const hisabNumber = `HSB-${year}-${String(id).padStart(4, '0')}`

    const lots = data.lots.map(l => ({
      cutting_id: Number(l.cutting_id),
      lot_number: l.lot_number,
      cutting_date: l.cutting_date,
      roll_id: Number(l.roll_id),
      roll_number: l.roll_number,
      fabric_type: l.fabric_type,
      meter_used: Number(l.meter_used || 0),
      piece_count: Number(l.piece_count || 0),
      stitching_status: l.stitching_status || 'Completed',
      rate_per_piece: Number(l.rate_per_piece || 0),
      amount: Number(l.amount || (Number(l.piece_count || 0) * Number(l.rate_per_piece || 0))),
      average: l.average ? Number(l.average) : (Number(l.piece_count) > 0 ? Number((Number(l.meter_used) / Number(l.piece_count)).toFixed(2)) : null)
    }))

    const totalPieces = lots.reduce((sum, l) => sum + l.piece_count, 0)
    const totalMeterUsed = lots.reduce((sum, l) => sum + l.meter_used, 0)
    const averageConsumption = totalPieces > 0 ? Number((totalMeterUsed / totalPieces).toFixed(2)) : 0
    const stitchingAmount = lots.reduce((sum, l) => sum + l.amount, 0)

    const extraCharges = Number(data.extra_charges || 0)
    const deductions = Number(data.deductions || 0)
    const totalAmount = stitchingAmount + extraCharges - deductions

    const paidAmount = Number(data.paid_amount || 0)
    const balanceAmount = Math.max(0, totalAmount - paidAmount)

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid'
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid'
    } else if (paidAmount > 0) {
      paymentStatus = 'Partially Paid'
    }

    const now = new Date().toISOString()
    const paymentMethod = data.payment_method || 'Cash'
    const handledBy = data.handled_by || 'Akshaybhai'

    let linkedPaymentId: number | null = null

    // If payment was recorded on the spot, sync into seth_payments & cashbook
    if (paidAmount > 0) {
      linkedPaymentId = await getNextSequence('seth_payments')
      const paymentDoc = {
        id: linkedPaymentId,
        seth_id: numSethId,
        payment_date: hisabDate,
        amount: paidAmount,
        payment_method: paymentMethod,
        notes: `Hisab Settlement #${hisabNumber} (${totalPieces} pcs @ ₹${lots[0]?.rate_per_piece || 0}/pc)`,
        handled_by: handledBy,
        created_at: now,
        updated_at: now
      }
      await db.collection('seth_payments').insertOne(paymentDoc)

      await CashBookService.logTransaction(
        hisabDate,
        'Seth Payment',
        seth.seth_name,
        paymentMethod,
        paidAmount,
        0,
        handledBy,
        'Seth Hisab',
        id,
        data.notes || `Settlement Hisab #${hisabNumber}`,
        undefined,
        { seth_payment_id: linkedPaymentId }
      )
    }

    const hisabDoc: SethHisabRecord = {
      id,
      hisab_number: hisabNumber,
      seth_id: numSethId,
      seth_name: seth.seth_name,
      hisab_date: hisabDate,
      lots,
      total_pieces: totalPieces,
      total_meter_used: totalMeterUsed,
      average_consumption: averageConsumption,
      stitching_amount: stitchingAmount,
      extra_charges: extraCharges,
      extra_charges_notes: data.extra_charges_notes || null,
      deductions,
      deductions_notes: data.deductions_notes || null,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      handled_by: handledBy,
      notes: data.notes || null,
      linked_payment_id: linkedPaymentId,
      created_at: now,
      updated_at: now
    }

    await db.collection('seth_hisabs').insertOne(hisabDoc)

    // Mark cutting entries and linked finished goods as settled
    const cuttingIds = lots.map(l => l.cutting_id)
    await db.collection('cutting_entries').updateMany(
      { id: { $in: cuttingIds } },
      { $set: { hisab_id: id, hisab_number: hisabNumber, updated_at: now } }
    )

    await db.collection('finished_goods').updateMany(
      { cutting_id: { $in: cuttingIds } },
      { $set: { hisab_id: id, hisab_number: hisabNumber, status: 'Closed', updated_at: now } }
    )

    // Trigger non-blocking real-time sync to Google Sheets
    GoogleSheetsService.syncHisab(hisabDoc)

    return hisabDoc
  }

  /**
   * Record a subsequent payment against an existing Hisab with pending balance
   */
  static async addPayment(
    hisabId: number,
    data: {
      payment_date?: string
      amount: number
      payment_method?: string
      handled_by?: string
      notes?: string
    }
  ) {
    const db = await getMongoDb()
    const numId = Number(hisabId)
    const hisab = await db.collection('seth_hisabs').findOne({ id: numId })
    if (!hisab) {
      throw new Error(`Hisab #${numId} not found`)
    }

    const paymentAmount = Number(data.amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0')
    }

    const newPaidAmount = Number(hisab.paid_amount || 0) + paymentAmount
    const totalAmount = Number(hisab.total_amount || 0)
    const newBalance = Math.max(0, totalAmount - newPaidAmount)

    let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Partially Paid'
    if (newBalance <= 0) {
      newStatus = 'Paid'
    }

    const payDate = data.payment_date || new Date().toISOString().split('T')[0]
    const method = data.payment_method || hisab.payment_method || 'Cash'
    const handledBy = data.handled_by || hisab.handled_by || 'Akshaybhai'
    const now = new Date().toISOString()

    // Create payment in seth_payments
    const paymentId = await getNextSequence('seth_payments')
    const paymentDoc = {
      id: paymentId,
      seth_id: hisab.seth_id,
      payment_date: payDate,
      amount: paymentAmount,
      payment_method: method,
      notes: `Balance Payment for Seth Hisab #${hisab.hisab_number}`,
      handled_by: handledBy,
      created_at: now,
      updated_at: now
    }
    await db.collection('seth_payments').insertOne(paymentDoc)

    // Log to cashbook
    await CashBookService.logTransaction(
      payDate,
      'Seth Payment',
      hisab.seth_name,
      method,
      paymentAmount,
      0,
      handledBy,
      'Seth Hisab',
      numId,
      data.notes || `Balance payment for Hisab #${hisab.hisab_number}`,
      undefined,
      { seth_payment_id: paymentId }
    )

    await db.collection('seth_hisabs').updateOne(
      { id: numId },
      {
        $set: {
          paid_amount: newPaidAmount,
          balance_amount: newBalance,
          payment_status: newStatus,
          updated_at: now
        }
      }
    )

    const updated = await this.getById(numId)
    if (updated) {
      GoogleSheetsService.syncHisab(updated)
    }
    return updated
  }

  /**
   * Delete a Hisab record and unlink cutting lots
   */
  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)
    const hisab = await db.collection('seth_hisabs').findOne({ id: numId })
    if (!hisab) return null

    // Unlink cutting entries
    await db.collection('cutting_entries').updateMany(
      { hisab_id: numId },
      { $unset: { hisab_id: '', hisab_number: '' }, $set: { updated_at: new Date().toISOString() } }
    )

    // Unlink finished goods and set status back to Ready
    await db.collection('finished_goods').updateMany(
      { hisab_id: numId },
      { $unset: { hisab_id: '', hisab_number: '' }, $set: { status: 'Ready', updated_at: new Date().toISOString() } }
    )

    // Delete cashbook and seth_payments if linked
    if (hisab.linked_payment_id) {
      await db.collection('seth_payments').deleteOne({ id: hisab.linked_payment_id })
      await CashBookService.deleteByReference('Seth Hisab', numId)
    }

    await db.collection('seth_hisabs').deleteOne({ id: numId })
    const { _id, ...rest } = hisab
    return rest
  }

  /**
   * Quick action to update stitching status on a cutting lot
   */
  static async updateStitchingStatus(cuttingId: number, status: 'Cut' | 'In Stitching' | 'Washing' | 'Ready' | 'Dispatched' | 'Closed') {
    const db = await getMongoDb()
    const numCuttingId = Number(cuttingId)

    const cut = await db.collection('cutting_entries').findOne({ id: numCuttingId })
    if (!cut) {
      throw new Error(`Cutting entry #${numCuttingId} not found`)
    }

    const fg = await db.collection('finished_goods').findOne({ cutting_id: numCuttingId })
    const now = new Date().toISOString()

    const pieces = Number(cut.piece_count || 0)
    const isCompleted = status === 'Ready' || status === 'Washing' || status === 'Dispatched' || status === 'Closed'

    if (fg) {
      await db.collection('finished_goods').updateOne(
        { cutting_id: numCuttingId },
        {
          $set: {
            status,
            finished_pieces: isCompleted ? pieces : fg.finished_pieces,
            stitching_pieces: status === 'In Stitching' ? pieces : (isCompleted ? 0 : fg.stitching_pieces),
            updated_at: now
          }
        }
      )
    } else {
      const roll = await db.collection('rolls').findOne({ id: cut.roll_id })
      const fgId = await getNextSequence('finished_goods')
      await db.collection('finished_goods').insertOne({
        id: fgId,
        cutting_id: numCuttingId,
        seth_id: roll?.seth_id || null,
        lot_number: cut.lot_number,
        item_name: 'Denim Jeans',
        size: cut.size,
        color_shade: 'Standard Indigo',
        total_pieces: pieces,
        stitching_pieces: status === 'In Stitching' ? pieces : 0,
        finished_pieces: isCompleted ? pieces : 0,
        rejected_pieces: 0,
        dispatched_pieces: 0,
        status,
        unit_price: 0,
        dispatch_date: null,
        notes: `Status updated via Hisab module`,
        created_at: now,
        updated_at: now
      })
    }

    return { success: true, cutting_id: numCuttingId, status }
  }

  /**
   * Generates a fully formatted Excel workbook buffer (.xlsx) for Seth Hisabs
   */
  static async exportExcel(filters?: { seth_id?: number; payment_status?: string; search?: string }): Promise<Buffer> {
    const hisabs = await this.getAll(filters)
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'DenimFlow ERP'
    workbook.created = new Date()

    // Sheet 1: Hisab Statements Summary
    const summarySheet = workbook.addWorksheet('Hisab Statements')
    summarySheet.columns = [
      { header: 'Hisab Number', key: 'hisab_number', width: 18 },
      { header: 'Date', key: 'hisab_date', width: 14 },
      { header: 'Seth Client', key: 'seth_name', width: 22 },
      { header: 'Total Pieces', key: 'total_pieces', width: 14 },
      { header: 'Total Fabric (m)', key: 'total_meter_used', width: 16 },
      { header: 'Average (m/pc)', key: 'average_consumption', width: 15 },
      { header: 'Stitching Amount (₹)', key: 'stitching_amount', width: 20 },
      { header: 'Extra Charges (₹)', key: 'extra_charges', width: 18 },
      { header: 'Extra Notes', key: 'extra_charges_notes', width: 22 },
      { header: 'Deductions (₹)', key: 'deductions', width: 16 },
      { header: 'Deduction Notes', key: 'deductions_notes', width: 22 },
      { header: 'Gross Total (₹)', key: 'total_amount', width: 18 },
      { header: 'Paid Amount (₹)', key: 'paid_amount', width: 18 },
      { header: 'Balance Due (₹)', key: 'balance_amount', width: 18 },
      { header: 'Status', key: 'payment_status', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 16 },
      { header: 'Handled By', key: 'handled_by', width: 16 },
      { header: 'Notes', key: 'notes', width: 25 },
    ]

    const headerRow = summarySheet.getRow(1)
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Navy blue
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 28

    // Sheet 2: Cutting Lots Detail
    const lotsSheet = workbook.addWorksheet('Cutting Lots Detail')
    lotsSheet.columns = [
      { header: 'Hisab Number', key: 'hisab_number', width: 18 },
      { header: 'Hisab Date', key: 'hisab_date', width: 14 },
      { header: 'Seth Client', key: 'seth_name', width: 22 },
      { header: 'Lot Number', key: 'lot_number', width: 16 },
      { header: 'Cutting Date', key: 'cutting_date', width: 14 },
      { header: 'Roll Number', key: 'roll_number', width: 16 },
      { header: 'Fabric Type', key: 'fabric_type', width: 22 },
      { header: 'Meter Used (m)', key: 'meter_used', width: 15 },
      { header: 'Piece Count', key: 'piece_count', width: 14 },
      { header: 'Rate (₹/pc)', key: 'rate_per_piece', width: 14 },
      { header: 'Lot Amount (₹)', key: 'amount', width: 16 },
      { header: 'Average (m/pc)', key: 'average', width: 15 },
      { header: 'Stitching Status', key: 'stitching_status', width: 16 },
    ]
    const lotsHeaderRow = lotsSheet.getRow(1)
    lotsHeaderRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    lotsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' } // Sky blue
    }
    lotsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    lotsHeaderRow.height = 28

    hisabs.forEach(h => {
      summarySheet.addRow({
        hisab_number: h.hisab_number,
        hisab_date: h.hisab_date,
        seth_name: h.seth_name,
        total_pieces: h.total_pieces,
        total_meter_used: h.total_meter_used,
        average_consumption: h.average_consumption,
        stitching_amount: h.stitching_amount,
        extra_charges: h.extra_charges,
        extra_charges_notes: h.extra_charges_notes || '',
        deductions: h.deductions,
        deductions_notes: h.deductions_notes || '',
        total_amount: h.total_amount,
        paid_amount: h.paid_amount,
        balance_amount: h.balance_amount,
        payment_status: h.payment_status,
        payment_method: h.payment_method,
        handled_by: h.handled_by,
        notes: h.notes || ''
      })

      ;(h.lots || []).forEach(l => {
        lotsSheet.addRow({
          hisab_number: h.hisab_number,
          hisab_date: h.hisab_date,
          seth_name: h.seth_name,
          lot_number: l.lot_number,
          cutting_date: l.cutting_date,
          roll_number: l.roll_number,
          fabric_type: l.fabric_type,
          meter_used: l.meter_used,
          piece_count: l.piece_count,
          rate_per_piece: l.rate_per_piece,
          amount: l.amount,
          average: l.average || (l.piece_count ? Number((l.meter_used / l.piece_count).toFixed(2)) : ''),
          stitching_status: l.stitching_status
        })
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Generates a CSV string of Seth Hisabs
   */
  static async exportCsv(filters?: { seth_id?: number; payment_status?: string; search?: string }): Promise<string> {
    const hisabs = await this.getAll(filters)
    const headers = [
      'Hisab Number',
      'Date',
      'Seth Client',
      'Total Pieces',
      'Total Fabric (m)',
      'Average (m/pc)',
      'Stitching Amount (Rs)',
      'Extra Charges (Rs)',
      'Extra Notes',
      'Deductions (Rs)',
      'Deduction Notes',
      'Gross Total (Rs)',
      'Paid Amount (Rs)',
      'Balance Due (Rs)',
      'Payment Status',
      'Payment Method',
      'Handled By',
      'Notes'
    ]

    const rows = hisabs.map(h => [
      `"${h.hisab_number}"`,
      `"${h.hisab_date}"`,
      `"${(h.seth_name || '').replace(/"/g, '""')}"`,
      h.total_pieces,
      h.total_meter_used,
      h.average_consumption,
      h.stitching_amount,
      h.extra_charges,
      `"${(h.extra_charges_notes || '').replace(/"/g, '""')}"`,
      h.deductions,
      `"${(h.deductions_notes || '').replace(/"/g, '""')}"`,
      h.total_amount,
      h.paid_amount,
      h.balance_amount,
      `"${h.payment_status}"`,
      `"${h.payment_method}"`,
      `"${(h.handled_by || '').replace(/"/g, '""')}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`
    ])

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  /**
   * Import Hisab entries from structured rows
   */
  static async importData(records: Array<{
    seth_name: string
    hisab_date?: string
    lot_number?: string
    roll_number?: string
    fabric_type?: string
    pieces?: number | string
    meter_used?: number | string
    rate_per_piece?: number | string
    extra_charges?: number | string
    extra_charges_notes?: string
    deductions?: number | string
    deductions_notes?: string
    paid_amount?: number | string
    payment_method?: string
    handled_by?: string
    notes?: string
  }>) {
    const db = await getMongoDb()
    let importedCount = 0
    const errors: string[] = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      try {
        const sethName = (row.seth_name || '').trim()
        if (!sethName) {
          errors.push(`Row ${i + 1}: Seth Name is required`)
          continue
        }

        // Find or create Seth
        let seth = await db.collection('seths').findOne({ seth_name: { $regex: `^${sethName}$`, $options: 'i' } })
        if (!seth) {
          const sethId = await getNextSequence('seths')
          const now = new Date().toISOString()
          seth = {
            id: sethId,
            seth_name: sethName,
            status: 'Active',
            created_at: now,
            updated_at: now
          }
          await db.collection('seths').insertOne(seth)
        }

        const rollNumber = (row.roll_number || `R-IMP-${Date.now().toString().slice(-4)}`).trim()
        const fabricType = (row.fabric_type || 'Denim Fabric').trim()
        const meterUsed = Number(row.meter_used) || 100
        const pieceCount = Number(row.pieces) || 100

        let roll = await db.collection('rolls').findOne({ roll_number: rollNumber, seth_id: seth.id })
        if (!roll) {
          const rollId = await getNextSequence('rolls')
          const now = new Date().toISOString()
          roll = {
            id: rollId,
            seth_id: seth.id,
            roll_number: rollNumber,
            short_number: rollNumber.slice(-3),
            fabric_type: fabricType,
            received_meter: meterUsed + 100,
            used_meter: meterUsed,
            remaining_meter: 100,
            status: 'Partially Used',
            entry_date: row.hisab_date || new Date().toISOString().split('T')[0],
            created_at: now,
            updated_at: now
          }
          await db.collection('rolls').insertOne(roll)
        }

        const lotNumber = (row.lot_number || `LOT-IMP-${Date.now().toString().slice(-4)}`).trim()
        let cutting = await db.collection('cutting_entries').findOne({ lot_number: lotNumber, roll_id: roll.id })
        if (!cutting) {
          const cutId = await getNextSequence('cutting_entries')
          const now = new Date().toISOString()
          cutting = {
            id: cutId,
            cutting_date: row.hisab_date || new Date().toISOString().split('T')[0],
            lot_number: lotNumber,
            roll_id: roll.id,
            meter_used: meterUsed,
            piece_count: pieceCount,
            size: 'Standard',
            average: pieceCount > 0 ? Number((meterUsed / pieceCount).toFixed(2)) : 1.3,
            created_at: now,
            updated_at: now
          }
          await db.collection('cutting_entries').insertOne(cutting)
        }

        const rate = Number(row.rate_per_piece) || 50
        await this.create({
          seth_id: seth.id,
          hisab_date: row.hisab_date,
          lots: [
            {
              cutting_id: cutting.id,
              lot_number: cutting.lot_number,
              cutting_date: cutting.cutting_date,
              roll_id: roll.id,
              roll_number: roll.roll_number,
              fabric_type: roll.fabric_type,
              meter_used: meterUsed,
              piece_count: pieceCount,
              stitching_status: 'Completed',
              rate_per_piece: rate,
              amount: pieceCount * rate,
              average: cutting.average
            }
          ],
          extra_charges: Number(row.extra_charges) || 0,
          extra_charges_notes: row.extra_charges_notes,
          deductions: Number(row.deductions) || 0,
          deductions_notes: row.deductions_notes,
          paid_amount: Number(row.paid_amount) || 0,
          payment_method: row.payment_method || 'Cash',
          handled_by: row.handled_by || 'Akshaybhai',
          notes: row.notes || 'Imported Hisab entry'
        })

        importedCount++
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return { success: importedCount > 0, importedCount, errors }
  }

  static getSampleTemplateCsv(): string {
    return [
      'Seth Name,Hisab Date,Lot Number,Roll Number,Fabric Type,Pieces,Meters Used,Stitching Rate,Extra Charges,Extra Charges Notes,Deductions,Deductions Notes,Paid Amount,Payment Method,Handled By,Notes',
      'Mahavir Seth,2026-11-15,LOT-101,R-101,Heavy Indigo Denim 12oz,150,200,50,500,Washing & Thread,0,,3000,Cash,Akshaybhai,Regular factory batch hisab',
      'Suresh Seth,2026-11-16,LOT-102,R-102,Indigo Knit Denim,200,260,48,0,,200,Defect shortage,5000,Bank Transfer,Akshaybhai,Sample import lot'
    ].join('\n')
  }
}

