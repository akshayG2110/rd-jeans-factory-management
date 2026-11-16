import { getMongoDb } from '../mongodb'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportFilterParams {
  date_from?: string
  date_to?: string
  employee_id?: string
  seth_id?: string
  handled_by?: string
  expense_category?: string
  income_source?: string
  status?: string
  roll_number?: string
  lot_number?: string
}

export class ReportService {
  /**
   * Fetches structured report rows for any of the 12 business categories with all applied filters.
   */
  static async exportData(category: string, filters: ReportFilterParams = {}) {
    const db = await getMongoDb()
    const cat = (category || 'cashbook').toLowerCase().trim()

    const {
      date_from,
      date_to,
      employee_id,
      seth_id,
      handled_by,
      expense_category,
      income_source,
      status,
      roll_number,
      lot_number
    } = filters

    switch (cat) {
      case 'employees': {
        const query: any = {}
        if (status) query.status = status
        const list = await db.collection('employees').find(query).sort({ id: 1 }).toArray()
        return list.map(e => ({
          id: e.id,
          employee_name: e.employee_name,
          role: e.role,
          joining_date: e.joining_date,
          status: e.status,
          created_at: String(e.created_at || '').slice(0, 10)
        }))
      }

      case 'salary': {
        const query: any = {}
        if (employee_id) query.employee_id = Number(employee_id)
        if (handled_by) query.handled_by = { $regex: handled_by, $options: 'i' }
        if (date_from || date_to) {
          query.payment_date = {}
          if (date_from) query.payment_date.$gte = date_from
          if (date_to) query.payment_date.$lte = date_to
        }
        const salaries = await db.collection('salaries').find(query).sort({ payment_date: -1, id: -1 }).toArray()
        const employees = await db.collection('employees').find({}).toArray()
        const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

        return salaries.map(s => ({
          id: s.id,
          payment_date: s.payment_date,
          employee_name: empMap.get(s.employee_id) || '',
          period: `${s.salary_month}/${s.salary_year}`,
          salary_amount: s.salary_amount,
          total_upad_deducted: s.total_upad_deducted,
          net_payable: s.net_payable,
          paid_amount: s.paid_amount,
          remaining_amount: s.remaining_amount,
          payment_method: s.payment_method,
          handled_by: s.handled_by,
          notes: s.notes || '-'
        }))
      }

      case 'upad': {
        const query: any = {}
        if (employee_id) query.employee_id = Number(employee_id)
        if (handled_by) query.handled_by = { $regex: handled_by, $options: 'i' }
        if (status) query.status = status
        if (date_from || date_to) {
          query.date = {}
          if (date_from) query.date.$gte = date_from
          if (date_to) query.date.$lte = date_to
        }
        const upads = await db.collection('upad_records').find(query).sort({ date: -1, id: -1 }).toArray()
        const employees = await db.collection('employees').find({}).toArray()
        const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

        return upads.map(u => ({
          id: u.id,
          date: u.date,
          employee_name: empMap.get(u.employee_id) || '',
          amount: u.amount,
          payment_method: u.payment_method,
          handled_by: u.handled_by,
          status: u.status,
          settled_in_salary_id: u.settled_in_salary_id || '-',
          settled_date: u.settled_at ? String(u.settled_at).slice(0, 10) : '-',
          notes: u.notes || '-'
        }))
      }

      case 'seths': {
        const query: any = {}
        if (status) query.status = status
        if (seth_id) query.id = Number(seth_id)
        const seths = await db.collection('seths').find(query).sort({ id: 1 }).toArray()
        const rolls = await db.collection('rolls').find({}).toArray()

        return seths.map(s => {
          const sRolls = rolls.filter(r => r.seth_id === s.id)
          const totalMeters = sRolls.reduce((sum, r) => sum + (Number(r.received_meter) || 0), 0)
          return {
            id: s.id,
            seth_name: s.seth_name,
            mobile_number: s.mobile_number || '-',
            address: s.address || '-',
            status: s.status,
            total_rolls: sRolls.length,
            total_meters_received: totalMeters,
            notes: s.notes || '-'
          }
        })
      }

      case 'fabric':
      case 'rolls': {
        const query: any = {}
        if (seth_id) query.seth_id = Number(seth_id)
        if (status) query.status = status
        if (roll_number) query.roll_number = { $regex: roll_number, $options: 'i' }
        if (date_from || date_to) {
          query.entry_date = {}
          if (date_from) query.entry_date.$gte = date_from
          if (date_to) query.entry_date.$lte = date_to
        }
        const rolls = await db.collection('rolls').find(query).sort({ entry_date: -1, id: -1 }).toArray()
        const seths = await db.collection('seths').find({}).toArray()
        const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))

        return rolls.map(r => ({
          id: r.id,
          entry_date: r.entry_date,
          seth_name: sethMap.get(r.seth_id) || '',
          roll_number: r.roll_number,
          short_number: r.short_number,
          fabric_type: r.fabric_type,
          received_meter: r.received_meter,
          used_meter: r.used_meter,
          remaining_meter: r.remaining_meter,
          status: r.status,
          notes: r.notes || '-'
        }))
      }

      case 'cutting': {
        const query: any = {}
        if (employee_id) query.employee_id = Number(employee_id)
        if (lot_number) query.lot_number = { $regex: lot_number, $options: 'i' }
        if (date_from || date_to) {
          query.cutting_date = {}
          if (date_from) query.cutting_date.$gte = date_from
          if (date_to) query.cutting_date.$lte = date_to
        }
        const cuts = await db.collection('cutting_entries').find(query).sort({ cutting_date: -1, id: -1 }).toArray()
        const rolls = await db.collection('rolls').find({}).toArray()
        const seths = await db.collection('seths').find({}).toArray()
        const employees = await db.collection('employees').find({}).toArray()

        const rollMap = new Map(rolls.map(r => [r.id, r]))
        const sethMap = new Map(seths.map(s => [s.id, s.seth_name]))
        const empMap = new Map(employees.map(e => [e.id, e.employee_name]))

        return cuts.map(c => {
          const roll = rollMap.get(c.roll_id)
          return {
            id: c.id,
            cutting_date: c.cutting_date,
            lot_number: c.lot_number,
            worker_name: c.employee_id ? empMap.get(c.employee_id) || 'Unassigned' : 'Unassigned',
            seth_name: roll ? sethMap.get(roll.seth_id) || '' : '',
            roll_number: roll?.roll_number || '',
            fabric_type: roll?.fabric_type || '',
            meter_used: c.meter_used,
            piece_count: c.piece_count,
            size: c.size,
            average: c.average || '-',
            sort_number: c.sort_number || '-',
            notes: c.notes || '-'
          }
        })
      }

      case 'income': {
        const query: any = {}
        if (income_source) query.income_source = income_source
        if (handled_by) query.handled_by = { $regex: handled_by, $options: 'i' }
        if (date_from || date_to) {
          query.income_date = {}
          if (date_from) query.income_date.$gte = date_from
          if (date_to) query.income_date.$lte = date_to
        }
        const incomes = await db.collection('incomes').find(query).sort({ income_date: -1, id: -1 }).toArray()
        return incomes.map(i => ({
          id: i.id,
          date: i.income_date,
          source: i.income_source,
          source_name: i.source_name,
          amount: i.amount,
          payment_method: i.payment_method,
          handled_by: i.handled_by,
          ref_no: i.reference_number || '-',
          notes: i.notes || '-'
        }))
      }

      case 'expense':
      case 'expenses': {
        const query: any = {}
        if (expense_category) query.expense_category = expense_category
        if (handled_by) query.handled_by = { $regex: handled_by, $options: 'i' }
        if (date_from || date_to) {
          query.expense_date = {}
          if (date_from) query.expense_date.$gte = date_from
          if (date_to) query.expense_date.$lte = date_to
        }
        const expenses = await db.collection('expenses').find(query).sort({ expense_date: -1, id: -1 }).toArray()
        return expenses.map(e => ({
          id: e.id,
          date: e.expense_date,
          category: e.expense_category,
          party_name: e.party_name,
          amount: e.amount,
          payment_method: e.payment_method,
          handled_by: e.handled_by,
          ref_no: e.reference_number || '-',
          notes: e.notes || '-'
        }))
      }

      case 'cashbook': {
        const query: any = {}
        if (handled_by) query.handled_by = { $regex: handled_by, $options: 'i' }
        if (date_from || date_to) {
          query.transaction_date = {}
          if (date_from) query.transaction_date.$gte = date_from
          if (date_to) query.transaction_date.$lte = date_to
        }
        const records = await db.collection('cash_book_ledger').find(query).sort({ transaction_date: -1, id: -1 }).toArray()
        return records.map(c => ({
          id: c.id,
          date: c.transaction_date,
          type: c.transaction_type,
          party_name: c.name,
          payment_method: c.payment_method,
          handled_by: c.handled_by,
          income: c.income_amount,
          out: c.out_amount,
          balance: c.running_balance,
          reference_module: c.reference_module,
          notes: c.notes || '-'
        }))
      }

      case 'partners': {
        const query: any = {}
        if (status) query.status = status
        const partners = await db.collection('partners').find(query).sort({ id: 1 }).toArray()
        const txs = await db.collection('partner_transactions').find({}).toArray()

        return partners.map(p => {
          const pTx = txs.filter(t => t.partner_id === p.id)
          let invested = 0
          let drawings = 0
          for (const t of pTx) {
            const amt = Number(t.amount) || 0
            if (t.transaction_type === 'Capital Investment' || t.transaction_type === 'Investment') invested += amt
            if (t.transaction_type === 'Drawing (Personal Withdrawal)' || t.transaction_type === 'Withdrawal') drawings += amt
          }
          return {
            id: p.id,
            partner_name: p.name,
            mobile_number: p.mobile_number || '-',
            profit_share_percentage: p.profit_share_percentage,
            opening_balance: p.opening_balance,
            equity_balance: p.current_balance,
            total_invested: invested,
            total_drawings: drawings,
            status: p.status,
            notes: p.notes || '-'
          }
        })
      }

      case 'factory-summary': {
        const [employees, rolls, cuts, cash, partners] = await Promise.all([
          db.collection('employees').find({}).toArray(),
          db.collection('rolls').find({}).toArray(),
          db.collection('cutting_entries').find({}).toArray(),
          db.collection('cash_book_ledger').find({}).sort({ transaction_date: -1, id: -1 }).toArray(),
          db.collection('partners').find({}).toArray()
        ])

        const activeEmployees = employees.filter(e => e.status === 'Active').length
        const totalReceivedM = rolls.reduce((sum, r) => sum + (Number(r.received_meter) || 0), 0)
        const inStockM = rolls.reduce((sum, r) => sum + (Number(r.remaining_meter) || 0), 0)
        const totalPieces = cuts.reduce((sum, c) => sum + (Number(c.piece_count) || 0), 0)
        const totalInflows = cash.reduce((sum, c) => sum + (Number(c.income_amount) || 0), 0)
        const totalOutflows = cash.reduce((sum, c) => sum + (Number(c.out_amount) || 0), 0)
        const currentCashBal = cash.length > 0 ? Number(cash[0].running_balance || 0) : 0
        const totalPartnerEquity = partners.reduce((sum, p) => sum + (Number(p.current_balance) || 0), 0)

        return [
          { metric: 'Total Employees', value: employees.length, details: `${activeEmployees} Active` },
          { metric: 'Fabric Rolls In Warehouse', value: rolls.length, details: `${inStockM} Meters Remaining (Total ${totalReceivedM}m)` },
          { metric: 'Cutting Production', value: `${totalPieces} Pieces`, details: `${cuts.length} Lots Cut` },
          { metric: 'Cashbook Inflows', value: `₹${totalInflows.toLocaleString('en-IN')}`, details: 'Total Company Cash In' },
          { metric: 'Cashbook Outflows', value: `₹${totalOutflows.toLocaleString('en-IN')}`, details: 'Total Company Cash Out' },
          { metric: 'Current Factory Cash Balance', value: `₹${currentCashBal.toLocaleString('en-IN')}`, details: 'Grand Cash Desk Balance' },
          { metric: 'Partner Capital Equity', value: `₹${totalPartnerEquity.toLocaleString('en-IN')}`, details: `${partners.length} Partners Total` }
        ]
      }

      default: {
        const list = await db.collection('cash_book_ledger').find({}).sort({ transaction_date: -1, id: -1 }).limit(100).toArray()
        return list.map(({ _id, ...rest }) => rest)
      }
    }
  }

  /**
   * Generates a fully formatted Excel workbook buffer (.xlsx) using ExcelJS.
   */
  static async generateExcel(category: string, filters: ReportFilterParams = {}): Promise<Buffer> {
    const data = await this.exportData(category, filters)
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'DenimFlow ERP'
    workbook.created = new Date()

    const catName = category.toUpperCase().replace('-', ' ')
    const worksheet = workbook.addWorksheet(`${category.slice(0, 30)} Report`)

    // Title & Metadata
    worksheet.mergeCells('A1:G1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `DENIMFLOW ERP - ${catName} REPORT`
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Navy blue
    }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getRow(1).height = 36

    // Subtitle / Filter Info
    worksheet.mergeCells('A2:G2')
    const subCell = worksheet.getCell('A2')
    const dateRangeStr = (filters.date_from || filters.date_to)
      ? `Date Range: ${filters.date_from || 'Beginning'} to ${filters.date_to || 'Present'}`
      : `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
    subCell.value = `${dateRangeStr} | Total Records: ${data.length}`
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
    subCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getRow(2).height = 20

    // Row 3 Blank spacer
    worksheet.getRow(3).height = 10

    if (data.length === 0) {
      worksheet.getCell('A4').value = 'No records found matching the specified filter criteria.'
      worksheet.getCell('A4').font = { name: 'Arial', size: 11, italic: true }
      const buffer = await workbook.xlsx.writeBuffer()
      return Buffer.from(buffer)
    }

    // Determine Column Headers
    const keys = Object.keys(data[0])
    const headerRow = worksheet.getRow(4)
    headerRow.values = keys.map(k => k.replace(/_/g, ' ').toUpperCase())
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Primary Blue
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 26

    // Data Rows
    data.forEach((rowObj: any, index: number) => {
      const rowIndex = 5 + index
      const row = worksheet.getRow(rowIndex)
      row.values = keys.map(k => {
        const val = rowObj[k]
        if (val === null || val === undefined) return '-'
        if (typeof val === 'number') return val
        return String(val)
      })

      // Zebra striping
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        }
      }

      // Add borders
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
      })
      row.height = 22
    })

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLen = 12
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : ''
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length, 45)
        }
      })
      column.width = maxLen + 4
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Generates a printable, styled PDF document buffer (.pdf) using jsPDF and autoTable.
   */
  static async generatePdf(category: string, filters: ReportFilterParams = {}): Promise<Buffer> {
    const data = await this.exportData(category, filters)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    })

    const catName = category.toUpperCase().replace('-', ' ')

    // Header Background Banner
    doc.setFillColor(30, 58, 138) // Navy Blue #1E3A8A
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 65, 'F')

    // Factory Title & Subheader
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('DENIMFLOW ERP', 40, 30)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`${catName} STATEMENT REPORT`, 40, 48)

    // Right-aligned Metadata
    doc.setFontSize(9)
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const rightX = doc.internal.pageSize.getWidth() - 40
    doc.text(`Generated: ${dateStr}`, rightX, 30, { align: 'right' })
    const filterInfo = (filters.date_from || filters.date_to)
      ? `Period: ${filters.date_from || 'Start'} to ${filters.date_to || 'End'}`
      : 'All Recorded Records'
    doc.text(filterInfo, rightX, 48, { align: 'right' })

    if (data.length === 0) {
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(12)
      doc.text('No records found matching the specified filters.', 40, 110)
      return Buffer.from(doc.output('arraybuffer'))
    }

    // Prepare table columns and rows
    const keys = Object.keys(data[0])
    const headers = [keys.map(k => k.replace(/_/g, ' ').toUpperCase())]
    const rows = data.map((item: any) => keys.map(k => {
      const val = item[k]
      if (val === null || val === undefined) return '-'
      if (typeof val === 'number') {
        return val.toLocaleString('en-IN')
      }
      return String(val)
    }))

    // Render table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 80,
      margin: { left: 40, right: 40, bottom: 40 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [37, 99, 235], // Blue #2563EB
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: () => {
        const pageNum = doc.internal.pages.length - 1
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `Page ${pageNum} | DenimFlow ERP Confidential Report`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        )
      }
    })

    return Buffer.from(doc.output('arraybuffer'))
  }
}
