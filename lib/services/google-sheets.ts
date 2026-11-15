import { getMongoDb } from '../mongodb'

export interface GoogleSheetsSettings {
  webhook_url: string
  auto_sync_enabled: boolean
  last_sync_at?: string | null
  total_synced?: number
  last_status?: 'success' | 'error' | null
  last_error?: string | null
  synced_modules?: string[]
}

const DEFAULT_SETTINGS: GoogleSheetsSettings = {
  webhook_url: '',
  auto_sync_enabled: true,
  last_sync_at: null,
  total_synced: 0,
  last_status: null,
  last_error: null,
  synced_modules: []
}

export interface ModuleSyncData {
  moduleKey: string
  sheetName: string
  headers: string[]
  rows: any[][]
  count: number
}

export class GoogleSheetsService {
  /**
   * Get current Google Sheets integration settings
   */
  static async getSettings(): Promise<GoogleSheetsSettings> {
    const db = await getMongoDb()
    const doc = await db.collection('integration_settings').findOne({ type: 'google_sheets' })
    if (!doc) return DEFAULT_SETTINGS
    const { _id, type, ...rest } = doc
    return rest as GoogleSheetsSettings
  }

  /**
   * Update Google Sheets settings
   */
  static async saveSettings(settings: Partial<GoogleSheetsSettings>): Promise<GoogleSheetsSettings> {
    const db = await getMongoDb()
    const now = new Date().toISOString()
    const current = await this.getSettings()

    const updated: GoogleSheetsSettings = {
      ...current,
      ...settings,
      webhook_url: settings.webhook_url !== undefined ? settings.webhook_url.trim() : current.webhook_url,
      auto_sync_enabled: settings.auto_sync_enabled !== undefined ? Boolean(settings.auto_sync_enabled) : current.auto_sync_enabled
    }

    await db.collection('integration_settings').updateOne(
      { type: 'google_sheets' },
      { $set: { type: 'google_sheets', ...updated, updated_at: now } },
      { upsert: true }
    )

    return updated
  }

  /**
   * Test connection to the Google Apps Script Webhook
   */
  static async testConnection(url?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = (url || (await this.getSettings()).webhook_url || '').trim()
    if (!targetUrl) {
      return { success: false, message: 'Webhook URL is not configured. Please paste your Google Apps Script Web App URL.' }
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return { success: false, message: `Google Sheets returned HTTP ${response.status}: ${response.statusText}` }
      }

      const json = await response.json().catch(() => ({}))
      return {
        success: true,
        message: json.message || 'Connected successfully! Google Sheet is ready to receive live factory data.'
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Check if deployment access is set to "Anyone"'}`
      }
    }
  }

  /**
   * Get counts of records across all 12 factory modules in MongoDB
   */
  static async getCounts(): Promise<Record<string, number>> {
    const db = await getMongoDb()
    const [
      employees,
      upad,
      seths,
      hisabSeth,
      cutting,
      finishedGoods,
      rolls,
      partners,
      income,
      expense,
      cashbook
    ] = await Promise.all([
      db.collection('employees').countDocuments().catch(() => 0),
      db.collection('upad_records').countDocuments().catch(() => 0),
      db.collection('seths').countDocuments().catch(() => 0),
      db.collection('seth_hisabs').countDocuments().catch(() => 0),
      db.collection('cutting_entries').countDocuments().catch(() => 0),
      db.collection('finished_goods').countDocuments().catch(() => 0),
      db.collection('rolls').countDocuments().catch(() => 0),
      db.collection('partners').countDocuments().catch(() => 0),
      db.collection('incomes').countDocuments().catch(() => 0),
      db.collection('expenses').countDocuments().catch(() => 0),
      db.collection('cash_book_ledger').countDocuments().catch(() => 0)
    ])

    return {
      employees,
      upad,
      seths,
      'hisab-seth': hisabSeth,
      cutting,
      inventory: finishedGoods,
      rolls,
      partners,
      income,
      expense,
      cashbook,
      reports: 7 // 7 core factory KPI metrics
    }
  }

  /**
   * Extract formatted headers and rows for a specific module
   */
  static async getModuleData(moduleKey: string): Promise<ModuleSyncData> {
    const db = await getMongoDb()
    const syncedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const key = (moduleKey || '').toLowerCase().trim()

    switch (key) {
      case 'employees': {
        const list = await db.collection('employees').find({}).sort({ id: 1 }).toArray()
        const headers = ['Employee ID', 'Employee Name', 'Role', 'Joining Date', 'Status', 'Created Date', 'Synced At']
        const rows = list.map(e => [
          e.id,
          e.employee_name || '',
          e.role || '',
          e.joining_date || '',
          e.status || 'Active',
          String(e.created_at || '').slice(0, 10),
          syncedAt
        ])
        return { moduleKey: 'employees', sheetName: 'Employees', headers, rows, count: rows.length }
      }

      case 'upad': {
        const [upads, employees] = await Promise.all([
          db.collection('upad_records').find({}).sort({ date: -1, id: -1 }).toArray(),
          db.collection('employees').find({}).toArray()
        ])
        const empMap = new Map(employees.map(e => [e.id, e.employee_name]))
        const headers = [
          'Upad ID', 'Date', 'Employee Name', 'Amount (₹)', 'Payment Method',
          'Handled By', 'Status', 'Settled In Salary ID', 'Settled Date', 'Notes', 'Synced At'
        ]
        const rows = upads.map(u => [
          u.id,
          u.date || '',
          empMap.get(u.employee_id) || `Employee #${u.employee_id}`,
          Number(u.amount) || 0,
          u.payment_method || 'Cash',
          u.handled_by || '',
          u.status || 'Pending',
          u.settled_in_salary_id || 'Pending',
          u.settled_at ? String(u.settled_at).slice(0, 10) : '-',
          u.notes || '',
          syncedAt
        ])
        return { moduleKey: 'upad', sheetName: 'Upad', headers, rows, count: rows.length }
      }

      case 'seths': {
        const [seths, rolls] = await Promise.all([
          db.collection('seths').find({}).sort({ id: 1 }).toArray(),
          db.collection('rolls').find({}).toArray()
        ])
        const headers = [
          'Seth ID', 'Seth Name', 'Mobile Number', 'Address', 'Status',
          'Total Rolls Received', 'Total Fabric Meters Received', 'Notes', 'Synced At'
        ]
        const rows = seths.map(s => {
          const sRolls = rolls.filter(r => r.seth_id === s.id)
          const totalMeters = sRolls.reduce((sum, r) => sum + (Number(r.received_meter) || 0), 0)
          return [
            s.id,
            s.seth_name || '',
            s.mobile_number || '-',
            s.address || '-',
            s.status || 'Active',
            sRolls.length,
            totalMeters,
            s.notes || '',
            syncedAt
          ]
        })
        return { moduleKey: 'seths', sheetName: 'Seths', headers, rows, count: rows.length }
      }

      case 'hisab-seth':
      case 'seth-hisab':
      case 'seth_hisabs': {
        const hisabs = await db.collection('seth_hisabs').find({}).sort({ hisab_date: -1, id: -1 }).toArray()
        const headers = [
          'Hisab Number', 'Date', 'Seth Client', 'Lots Count', 'Total Pieces', 'Total Fabric (m)',
          'Average (m/pc)', 'Stitching Rate (₹)', 'Stitching Amount (₹)', 'Extra Charges (₹)',
          'Deductions (₹)', 'Gross Total (₹)', 'Paid Amount (₹)', 'Balance Due (₹)',
          'Payment Status', 'Payment Method', 'Handled By', 'Notes', 'Synced At'
        ]
        const rows = hisabs.map(h => [
          h.hisab_number || '',
          h.hisab_date || '',
          h.seth_name || '',
          (h.lots || []).length,
          Number(h.total_pieces) || 0,
          Number(h.total_meter_used) || 0,
          Number(h.average_consumption) || 0,
          Number(h.stitching_rate) || 0,
          Number(h.stitching_amount) || 0,
          Number(h.extra_charges) || 0,
          Number(h.deductions) || 0,
          Number(h.total_amount) || 0,
          Number(h.paid_amount) || 0,
          Number(h.balance_amount) || 0,
          h.payment_status || 'Pending',
          h.payment_method || 'Cash',
          h.handled_by || '',
          h.notes || '',
          syncedAt
        ])
        return { moduleKey: 'hisab-seth', sheetName: 'Seth Hisab', headers, rows, count: rows.length }
      }

      case 'cutting': {
        const [cuts, rolls, seths, employees] = await Promise.all([
          db.collection('cutting_entries').find({}).sort({ cutting_date: -1, id: -1 }).toArray(),
          db.collection('rolls').find({}).toArray(),
          db.collection('seths').find({}).toArray(),
          db.collection('employees').find({}).toArray()
        ])
        const rollMap = new Map(rolls.map(r => [r.id, r]))
        const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))
        const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

        const headers = [
          'Cutting ID', 'Cutting Date', 'Lot Number', 'Worker / Cutter', 'Seth Client',
          'Roll Number', 'Fabric Type', 'Meters Used', 'Pieces Cut', 'Size',
          'Pana', 'Average (m/pc)', 'Sort Number', 'Notes', 'Synced At'
        ]
        const rows = cuts.map(c => {
          const roll = rollMap.get(c.roll_id)
          return [
            c.id,
            c.cutting_date || '',
            c.lot_number || '',
            c.employee_id ? empMap.get(c.employee_id) || 'Unassigned' : 'Unassigned',
            roll ? sethMap.get(roll.seth_id) || '-' : '-',
            roll?.roll_number || '-',
            roll?.fabric_type || '-',
            Number(c.meter_used) || 0,
            Number(c.piece_count) || 0,
            c.size || '',
            c.pana || '-',
            c.average || '-',
            c.sort_number || '-',
            c.notes || '',
            syncedAt
          ]
        })
        return { moduleKey: 'cutting', sheetName: 'Cutting', headers, rows, count: rows.length }
      }

      case 'inventory':
      case 'finished-goods':
      case 'finished_goods': {
        const [goods, seths] = await Promise.all([
          db.collection('finished_goods').find({}).sort({ id: 1 }).toArray(),
          db.collection('seths').find({}).toArray()
        ])
        const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))

        const headers = [
          'ID', 'Lot Number', 'Seth Client', 'Item Name', 'Size', 'Color Shade',
          'Total Pieces', 'In Stitching', 'Finished / Ready', 'Rejected', 'Dispatched',
          'Unit Price (₹)', 'Status', 'Dispatch Date', 'Notes', 'Synced At'
        ]
        const rows = goods.map(g => [
          g.id,
          g.lot_number || '',
          g.seth_id ? sethMap.get(g.seth_id) || '-' : '-',
          g.item_name || 'Jeans',
          g.size || '',
          g.color_shade || '',
          Number(g.total_pieces) || 0,
          Number(g.stitching_pieces) || 0,
          Number(g.finished_pieces) || 0,
          Number(g.rejected_pieces) || 0,
          Number(g.dispatched_pieces) || 0,
          Number(g.unit_price) || 0,
          g.status || 'Ready',
          g.dispatch_date || '-',
          g.notes || '',
          syncedAt
        ])
        return { moduleKey: 'inventory', sheetName: 'Finished Goods', headers, rows, count: rows.length }
      }

      case 'rolls': {
        const [rolls, seths] = await Promise.all([
          db.collection('rolls').find({}).sort({ entry_date: -1, id: -1 }).toArray(),
          db.collection('seths').find({}).toArray()
        ])
        const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))

        const headers = [
          'Roll ID', 'Entry Date', 'Seth Client', 'Roll Number', 'Short Number',
          'Fabric Type', 'Received Meters', 'Used Meters', 'Remaining Meters', 'Status', 'Notes', 'Synced At'
        ]
        const rows = rolls.map(r => [
          r.id,
          r.entry_date || '',
          sethMap.get(r.seth_id) || `Seth #${r.seth_id}`,
          r.roll_number || '',
          r.short_number || '-',
          r.fabric_type || '',
          Number(r.received_meter) || 0,
          Number(r.used_meter) || 0,
          Number(r.remaining_meter) || 0,
          r.status || 'Available',
          r.notes || '',
          syncedAt
        ])
        return { moduleKey: 'rolls', sheetName: 'Rolls', headers, rows, count: rows.length }
      }

      case 'partners': {
        const [partners, txs] = await Promise.all([
          db.collection('partners').find({}).sort({ id: 1 }).toArray(),
          db.collection('partner_transactions').find({}).toArray()
        ])
        const headers = [
          'Partner ID', 'Partner Name', 'Mobile Number', 'Profit Share %',
          'Opening Balance (₹)', 'Current Equity Balance (₹)', 'Total Invested (₹)',
          'Total Drawings (₹)', 'Status', 'Notes', 'Synced At'
        ]
        const rows = partners.map(p => {
          const pTx = txs.filter(t => t.partner_id === p.id)
          let invested = 0
          let drawings = 0
          for (const t of pTx) {
            const amt = Number(t.amount) || 0
            if (t.transaction_type === 'Capital Investment' || t.transaction_type === 'Investment') invested += amt
            if (t.transaction_type === 'Drawing (Personal Withdrawal)' || t.transaction_type === 'Withdrawal') drawings += amt
          }
          return [
            p.id,
            p.name || '',
            p.mobile_number || '-',
            Number(p.profit_share_percentage) || 0,
            Number(p.opening_balance) || 0,
            Number(p.current_balance) || 0,
            invested,
            drawings,
            p.status || 'Active',
            p.notes || '',
            syncedAt
          ]
        })
        return { moduleKey: 'partners', sheetName: 'Partners', headers, rows, count: rows.length }
      }

      case 'income': {
        const list = await db.collection('incomes').find({}).sort({ income_date: -1, id: -1 }).toArray()
        const headers = [
          'Income ID', 'Income Date', 'Source Category', 'Party / Source Name',
          'Amount (₹)', 'Payment Method', 'Handled By', 'Reference Number', 'Notes', 'Synced At'
        ]
        const rows = list.map(i => [
          i.id,
          i.income_date || '',
          i.income_source || '',
          i.source_name || '',
          Number(i.amount) || 0,
          i.payment_method || 'Cash',
          i.handled_by || '',
          i.reference_number || '-',
          i.notes || '',
          syncedAt
        ])
        return { moduleKey: 'income', sheetName: 'Income', headers, rows, count: rows.length }
      }

      case 'expense':
      case 'expenses': {
        const list = await db.collection('expenses').find({}).sort({ expense_date: -1, id: -1 }).toArray()
        const headers = [
          'Expense ID', 'Expense Date', 'Expense Category', 'Party / Payee Name',
          'Amount (₹)', 'Payment Method', 'Handled By', 'Reference Number', 'Notes', 'Synced At'
        ]
        const rows = list.map(e => [
          e.id,
          e.expense_date || '',
          e.expense_category || '',
          e.party_name || '',
          Number(e.amount) || 0,
          e.payment_method || 'Cash',
          e.handled_by || '',
          e.reference_number || '-',
          e.notes || '',
          syncedAt
        ])
        return { moduleKey: 'expense', sheetName: 'Expenses', headers, rows, count: rows.length }
      }

      case 'cashbook': {
        const list = await db.collection('cash_book_ledger').find({}).sort({ id: 1 }).toArray()
        const headers = [
          'Entry ID', 'Date', 'Transaction Type', 'Party / Particulars', 'Payment Method',
          'Handled By', 'Income (₹)', 'Expense / Out (₹)', 'Running Balance (₹)', 'Reference Module', 'Notes', 'Synced At'
        ]
        const rows = list.map(c => [
          c.id,
          c.transaction_date || '',
          c.transaction_type || '',
          c.name || '',
          c.payment_method || 'Cash',
          c.handled_by || '',
          Number(c.income_amount) || 0,
          Number(c.out_amount) || 0,
          Number(c.running_balance) || 0,
          c.reference_module || '',
          c.notes || '',
          syncedAt
        ])
        return { moduleKey: 'cashbook', sheetName: 'Cash Book', headers, rows, count: rows.length }
      }

      case 'reports':
      case 'summary':
      case 'factory-summary':
      default: {
        const [employees, rolls, cuts, cash, partners, hisabs] = await Promise.all([
          db.collection('employees').find({}).toArray(),
          db.collection('rolls').find({}).toArray(),
          db.collection('cutting_entries').find({}).toArray(),
          db.collection('cash_book_ledger').find({}).sort({ id: -1 }).limit(1).toArray(),
          db.collection('partners').find({}).toArray(),
          db.collection('seth_hisabs').find({}).toArray()
        ])

        const activeEmployees = employees.filter(e => e.status === 'Active').length
        const totalReceivedM = rolls.reduce((sum, r) => sum + (Number(r.received_meter) || 0), 0)
        const inStockM = rolls.reduce((sum, r) => sum + (Number(r.remaining_meter) || 0), 0)
        const totalPieces = cuts.reduce((sum, c) => sum + (Number(c.piece_count) || 0), 0)
        const currentCashBal = cash.length > 0 ? Number(cash[0].running_balance || 0) : 0
        const totalPartnerEquity = partners.reduce((sum, p) => sum + (Number(p.current_balance) || 0), 0)
        const totalHisabAmount = hisabs.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
        const totalHisabPending = hisabs.reduce((sum, h) => sum + (Number(h.balance_amount) || 0), 0)

        const headers = ['Factory Metric / KPI', 'Value', 'Operational Details', 'Report Generated At']
        const rows = [
          ['Total Employees', `${employees.length} Staff`, `${activeEmployees} Active on Floor`, syncedAt],
          ['Fabric Rolls In Warehouse', `${rolls.length} Rolls`, `${inStockM} Meters Remaining (Total ${totalReceivedM}m Received)`, syncedAt],
          ['Cutting Production', `${totalPieces} Total Pieces`, `${cuts.length} Lots Cut`, syncedAt],
          ['Seth Settlement Billed', `₹${totalHisabAmount.toLocaleString('en-IN')}`, `${hisabs.length} Total Hisab Slips Generated`, syncedAt],
          ['Seth Pending Balance', `₹${totalHisabPending.toLocaleString('en-IN')}`, 'Pending Receivables from Seths', syncedAt],
          ['Current Factory Cash Balance', `₹${currentCashBal.toLocaleString('en-IN')}`, 'Cash Desk Running Balance', syncedAt],
          ['Partner Capital Equity', `₹${totalPartnerEquity.toLocaleString('en-IN')}`, `${partners.length} Partners Registered`, syncedAt]
        ]
        return { moduleKey: 'reports', sheetName: 'Reports Summary', headers, rows, count: rows.length }
      }
    }
  }

  /**
   * Fetch all 12 modules into a dictionary for simultaneous multi-sheet upload
   */
  static async getAllFactoryData(): Promise<Record<string, { headers: string[]; rows: any[][] }>> {
    const moduleKeys = [
      'employees',
      'upad',
      'seths',
      'hisab-seth',
      'cutting',
      'inventory',
      'rolls',
      'partners',
      'income',
      'expense',
      'cashbook',
      'reports'
    ]

    const modulesData = await Promise.all(moduleKeys.map(k => this.getModuleData(k)))
    const dict: Record<string, { headers: string[]; rows: any[][] }> = {}

    for (const mod of modulesData) {
      dict[mod.sheetName] = {
        headers: mod.headers,
        rows: mod.rows
      }
    }

    return dict
  }

  /**
   * Sync a single module to its specific sheet tab in Google Sheets
   */
  static async syncModule(moduleKey: string): Promise<{ success: boolean; sheetName: string; count: number; message: string }> {
    const settings = await this.getSettings()
    if (!settings.webhook_url) {
      return { success: false, sheetName: '', count: 0, message: 'Google Sheets Webhook URL is not configured' }
    }

    const data = await this.getModuleData(moduleKey)
    const payload = {
      action: 'sync_module',
      module: data.sheetName,
      headers: data.headers,
      rows: data.rows
    }

    try {
      const res = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
      })

      if (!res.ok) {
        throw new Error(`Google Sheets responded with HTTP ${res.status}`)
      }

      const now = new Date().toISOString()
      const db = await getMongoDb()
      await db.collection('integration_settings').updateOne(
        { type: 'google_sheets' },
        {
          $set: {
            last_sync_at: now,
            last_status: 'success',
            last_error: null
          },
          $addToSet: { synced_modules: data.sheetName }
        }
      )

      return {
        success: true,
        sheetName: data.sheetName,
        count: data.rows.length,
        message: `Successfully synced ${data.rows.length} rows to sheet tab "${data.sheetName}"!`
      }
    } catch (err: any) {
      const db = await getMongoDb()
      await db.collection('integration_settings').updateOne(
        { type: 'google_sheets' },
        { $set: { last_status: 'error', last_error: err.message } }
      )
      return { success: false, sheetName: data.sheetName, count: 0, message: err.message || 'Sync failed' }
    }
  }

  /**
   * Sync ALL 12 factory modules into separate sheets simultaneously
   */
  static async syncAllFactory(): Promise<{
    success: boolean
    total_sheets: number
    total_rows: number
    details: Record<string, number>
    message: string
  }> {
    const settings = await this.getSettings()
    if (!settings.webhook_url) {
      return {
        success: false,
        total_sheets: 0,
        total_rows: 0,
        details: {},
        message: 'Google Sheets Webhook URL is not configured. Please paste your Apps Script URL.'
      }
    }

    const factoryData = await this.getAllFactoryData()
    const payload = {
      action: 'sync_factory',
      modules: factoryData
    }

    let totalRows = 0
    const details: Record<string, number> = {}
    for (const [name, mod] of Object.entries(factoryData)) {
      details[name] = mod.rows.length
      totalRows += mod.rows.length
    }

    try {
      const res = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000)
      })

      if (!res.ok) {
        throw new Error(`Google Sheets responded with HTTP ${res.status}`)
      }

      const now = new Date().toISOString()
      const db = await getMongoDb()
      await db.collection('integration_settings').updateOne(
        { type: 'google_sheets' },
        {
          $set: {
            last_sync_at: now,
            last_status: 'success',
            last_error: null,
            total_synced: totalRows,
            synced_modules: Object.keys(factoryData)
          }
        }
      )

      return {
        success: true,
        total_sheets: Object.keys(factoryData).length,
        total_rows: totalRows,
        details,
        message: `Successfully synced all ${Object.keys(factoryData).length} sheets (${totalRows} total records) to Google Sheets!`
      }
    } catch (err: any) {
      const db = await getMongoDb()
      await db.collection('integration_settings').updateOne(
        { type: 'google_sheets' },
        { $set: { last_status: 'error', last_error: err.message } }
      )
      return {
        success: false,
        total_sheets: 0,
        total_rows: 0,
        details: {},
        message: err.message || 'Factory sync failed'
      }
    }
  }

  /**
   * Sync a single Hisab entry in real-time to Google Sheets (non-blocking)
   */
  static async syncHisab(hisab: any) {
    try {
      const settings = await this.getSettings()
      if (!settings.auto_sync_enabled || !settings.webhook_url) {
        return { skipped: true }
      }

      const syncedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      const headers = [
        'Hisab Number', 'Date', 'Seth Client', 'Lots Count', 'Total Pieces', 'Total Fabric (m)',
        'Average (m/pc)', 'Stitching Rate (₹)', 'Stitching Amount (₹)', 'Extra Charges (₹)',
        'Deductions (₹)', 'Gross Total (₹)', 'Paid Amount (₹)', 'Balance Due (₹)',
        'Payment Status', 'Payment Method', 'Handled By', 'Notes', 'Synced At'
      ]

      const row = [
        hisab.hisab_number || '',
        hisab.hisab_date || '',
        hisab.seth_name || '',
        (hisab.lots || []).length,
        Number(hisab.total_pieces) || 0,
        Number(hisab.total_meter_used) || 0,
        Number(hisab.average_consumption) || 0,
        Number(hisab.stitching_rate) || 0,
        Number(hisab.stitching_amount) || 0,
        Number(hisab.extra_charges) || 0,
        Number(hisab.deductions) || 0,
        Number(hisab.total_amount) || 0,
        Number(hisab.paid_amount) || 0,
        Number(hisab.balance_amount) || 0,
        hisab.payment_status || 'Pending',
        hisab.payment_method || 'Cash',
        hisab.handled_by || '',
        hisab.notes || '',
        syncedAt
      ]

      const payload = {
        action: 'append_row',
        module: 'Seth Hisab',
        headers,
        row
      }

      fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      })
        .then(async (res) => {
          if (res.ok) {
            const db = await getMongoDb()
            await db.collection('integration_settings').updateOne(
              { type: 'google_sheets' },
              {
                $inc: { total_synced: 1 },
                $set: { last_sync_at: new Date().toISOString(), last_status: 'success', last_error: null }
              }
            )
          }
        })
        .catch(err => {
          console.error('Google Sheets real-time hisab sync error:', err.message)
        })

      return { success: true }
    } catch (err: any) {
      console.error('Error in syncHisab:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Sync a real-time event for any factory module (non-blocking)
   */
  static async syncRealtimeRow(moduleKey: string, rowData: any) {
    try {
      const settings = await this.getSettings()
      if (!settings.auto_sync_enabled || !settings.webhook_url) {
        return { skipped: true }
      }

      // Convert rowData into structured row
      const data = await this.getModuleData(moduleKey)
      const payload = {
        action: 'append_row',
        module: data.sheetName,
        headers: data.headers,
        row: rowData
      }

      fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      }).catch(err => {
        console.error(`Google Sheets real-time sync error for ${data.sheetName}:`, err.message)
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Bulk sync all existing Hisab records to Google Sheet (legacy alias for backwards compatibility)
   */
  static async syncAllHisabs(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await this.syncModule('hisab-seth')
    return {
      success: res.success,
      count: res.count,
      message: res.message
    }
  }

  /**
   * Ready-to-paste Google Apps Script code for the user with multi-sheet support
   */
  static getGoogleAppsScriptCode(): string {
    return `// =========================================================================
// AKSHAY RD JEANS FACTORY - GOOGLE SHEETS LIVE MULTI-SHEET SYNC SCRIPT
// =========================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action;

    // 1. Connection Ping Test
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Connected! Google Sheet is ready to receive live factory data across all tabs."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Helper: Create or update a specific sheet tab
    function updateSheetTab(sheetName, headers, rows) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.clearContents();
      
      // Write Header Row with Navy Blue styling
      if (headers && headers.length > 0) {
        sheet.appendRow(headers);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#1E3A8A"); // Navy blue
        headerRange.setFontColor("#FFFFFF");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
      }
      
      // Batch write all data rows instantly
      if (rows && rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      // Auto-fit column widths
      if (headers && headers.length > 0) {
        sheet.autoResizeColumns(1, Math.min(headers.length, 20));
      }
      
      return rows ? rows.length : 0;
    }

    // 2. Full Factory Sync: All 12 modules in separate tabs
    if (action === "sync_factory") {
      var results = {};
      var modules = data.modules || {};
      for (var modName in modules) {
        if (modules.hasOwnProperty(modName)) {
          var mod = modules[modName];
          results[modName] = updateSheetTab(modName, mod.headers, mod.rows);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All factory modules synced to separate sheet tabs successfully!",
        results: results
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Single Module Sync
    if (action === "sync_module" || action === "replace_all") {
      var modName = data.module || "General";
      var count = updateSheetTab(modName, data.headers || [], data.rows || []);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        module: modName,
        rowCount: count
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Real-time Append Row (for live creations)
    if (action === "append_row") {
      var sheetName = data.module || "General";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      if (sheet.getLastRow() === 0 && data.headers && data.headers.length > 0) {
        sheet.appendRow(data.headers);
        var headerRange = sheet.getRange(1, 1, 1, data.headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#1E3A8A");
        headerRange.setFontColor("#FFFFFF");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
      }
      if (data.row) {
        sheet.appendRow(data.row);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        module: sheetName,
        rowCount: sheet.getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`
  }
}
