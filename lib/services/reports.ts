import { query } from '../db'
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
    let sql = ''
    const params: any[] = []
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
        sql = `SELECT id, employee_name, role, to_char(joining_date, 'YYYY-MM-DD') as joining_date, status, to_char(created_at, 'YYYY-MM-DD') as created_at FROM employees WHERE 1=1`
        if (status) {
          params.push(status)
          sql += ` AND status = $${params.length}`
        }
        sql += ' ORDER BY id ASC'
        break
      }

      case 'salary': {
        sql = `
          SELECT 
            s.id, 
            to_char(s.payment_date, 'YYYY-MM-DD') as payment_date, 
            e.employee_name, 
            (s.salary_month || '/' || s.salary_year) as period, 
            s.salary_amount, 
            s.total_upad_deducted, 
            s.net_payable, 
            s.paid_amount, 
            s.remaining_amount, 
            s.payment_method, 
            s.handled_by, 
            s.notes 
          FROM salaries s 
          LEFT JOIN employees e ON s.employee_id = e.id 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND s.payment_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND s.payment_date <= $${params.length}`
        }
        if (employee_id) {
          params.push(parseInt(employee_id, 10))
          sql += ` AND s.employee_id = $${params.length}`
        }
        if (handled_by) {
          params.push(handled_by)
          sql += ` AND s.handled_by ILIKE $${params.length}`
        }
        sql += ' ORDER BY s.payment_date DESC, s.id DESC'
        break
      }

      case 'upad': {
        sql = `
          SELECT 
            u.id, 
            to_char(u.date, 'YYYY-MM-DD') as date, 
            e.employee_name, 
            u.amount, 
            u.payment_method, 
            u.handled_by, 
            u.status, 
            u.settled_in_salary_id, 
            to_char(u.settled_at, 'YYYY-MM-DD') as settled_date, 
            u.notes 
          FROM upad_records u 
          LEFT JOIN employees e ON u.employee_id = e.id 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND u.date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND u.date <= $${params.length}`
        }
        if (employee_id) {
          params.push(parseInt(employee_id, 10))
          sql += ` AND u.employee_id = $${params.length}`
        }
        if (handled_by) {
          params.push(handled_by)
          sql += ` AND u.handled_by ILIKE $${params.length}`
        }
        if (status) {
          params.push(status)
          sql += ` AND u.status = $${params.length}`
        }
        sql += ' ORDER BY u.date DESC, u.id DESC'
        break
      }

      case 'seths': {
        sql = `
          SELECT 
            s.id, 
            s.seth_name, 
            s.mobile_number, 
            s.address, 
            s.status, 
            COALESCE(COUNT(DISTINCT r.id), 0) as total_rolls, 
            COALESCE(SUM(r.received_meter), 0) as total_meters_received, 
            s.notes 
          FROM seths s 
          LEFT JOIN rolls r ON s.id = r.seth_id 
          WHERE 1=1
        `
        if (status) {
          params.push(status)
          sql += ` AND s.status = $${params.length}`
        }
        if (seth_id) {
          params.push(parseInt(seth_id, 10))
          sql += ` AND s.id = $${params.length}`
        }
        sql += ' GROUP BY s.id, s.seth_name, s.mobile_number, s.address, s.status, s.notes ORDER BY s.id ASC'
        break
      }

      case 'fabric':
      case 'rolls': {
        sql = `
          SELECT 
            r.id, 
            to_char(r.entry_date, 'YYYY-MM-DD') as entry_date, 
            s.seth_name, 
            r.roll_number, 
            r.short_number, 
            r.fabric_type, 
            r.received_meter, 
            r.used_meter, 
            r.remaining_meter, 
            r.status, 
            r.notes 
          FROM rolls r 
          LEFT JOIN seths s ON r.seth_id = s.id 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND r.entry_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND r.entry_date <= $${params.length}`
        }
        if (seth_id) {
          params.push(parseInt(seth_id, 10))
          sql += ` AND r.seth_id = $${params.length}`
        }
        if (status) {
          params.push(status)
          sql += ` AND r.status = $${params.length}`
        }
        if (roll_number) {
          params.push(`%${roll_number}%`)
          sql += ` AND r.roll_number ILIKE $${params.length}`
        }
        sql += ' ORDER BY r.entry_date DESC, r.id DESC'
        break
      }

      case 'cutting': {
        sql = `
          SELECT 
            c.id, 
            to_char(c.cutting_date, 'YYYY-MM-DD') as cutting_date, 
            c.lot_number, 
            COALESCE(e.employee_name, 'Unassigned') as worker_name, 
            s.seth_name, 
            r.roll_number, 
            r.fabric_type, 
            c.meter_used, 
            c.piece_count, 
            c.size, 
            c.average, 
            c.sort_number, 
            c.notes 
          FROM cutting_entries c 
          LEFT JOIN rolls r ON c.roll_id = r.id 
          LEFT JOIN seths s ON r.seth_id = s.id 
          LEFT JOIN employees e ON c.employee_id = e.id 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND c.cutting_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND c.cutting_date <= $${params.length}`
        }
        if (employee_id) {
          params.push(parseInt(employee_id, 10))
          sql += ` AND c.employee_id = $${params.length}`
        }
        if (seth_id) {
          params.push(parseInt(seth_id, 10))
          sql += ` AND r.seth_id = $${params.length}`
        }
        if (lot_number) {
          params.push(`%${lot_number}%`)
          sql += ` AND c.lot_number ILIKE $${params.length}`
        }
        if (roll_number) {
          params.push(`%${roll_number}%`)
          sql += ` AND r.roll_number ILIKE $${params.length}`
        }
        sql += ' ORDER BY c.cutting_date DESC, c.id DESC'
        break
      }

      case 'income': {
        sql = `
          SELECT 
            id, 
            to_char(income_date, 'YYYY-MM-DD') as date, 
            income_source as source, 
            source_name, 
            amount, 
            payment_method, 
            handled_by, 
            reference_number as ref_no, 
            notes 
          FROM incomes 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND income_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND income_date <= $${params.length}`
        }
        if (income_source) {
          params.push(income_source)
          sql += ` AND income_source = $${params.length}`
        }
        if (handled_by) {
          params.push(handled_by)
          sql += ` AND handled_by ILIKE $${params.length}`
        }
        sql += ' ORDER BY income_date DESC, id DESC'
        break
      }

      case 'expense':
      case 'expenses': {
        sql = `
          SELECT 
            id, 
            to_char(expense_date, 'YYYY-MM-DD') as date, 
            expense_category as category, 
            party_name, 
            amount, 
            payment_method, 
            handled_by, 
            reference_number as ref_no, 
            notes 
          FROM expenses 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND expense_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND expense_date <= $${params.length}`
        }
        if (expense_category) {
          params.push(expense_category)
          sql += ` AND expense_category = $${params.length}`
        }
        if (handled_by) {
          params.push(handled_by)
          sql += ` AND handled_by ILIKE $${params.length}`
        }
        sql += ' ORDER BY expense_date DESC, id DESC'
        break
      }

      case 'cashbook': {
        sql = `
          SELECT 
            id, 
            to_char(transaction_date, 'YYYY-MM-DD') as date, 
            transaction_type as type, 
            name as party_name, 
            payment_method, 
            handled_by, 
            income_amount as income, 
            out_amount as out, 
            running_balance as balance, 
            reference_module, 
            notes 
          FROM cash_book_ledger 
          WHERE 1=1
        `
        if (date_from) {
          params.push(date_from)
          sql += ` AND transaction_date >= $${params.length}`
        }
        if (date_to) {
          params.push(date_to)
          sql += ` AND transaction_date <= $${params.length}`
        }
        if (handled_by) {
          params.push(handled_by)
          sql += ` AND handled_by ILIKE $${params.length}`
        }
        sql += ' ORDER BY transaction_date DESC, id DESC'
        break
      }

      case 'partners': {
        sql = `
          SELECT 
            p.id, 
            p.name as partner_name, 
            p.mobile_number, 
            p.profit_share_percentage, 
            p.opening_balance, 
            p.current_balance as equity_balance, 
            COALESCE(SUM(CASE WHEN pt.transaction_type IN ('Capital Investment', 'Investment') THEN pt.amount ELSE 0 END), 0) as total_invested,
            COALESCE(SUM(CASE WHEN pt.transaction_type IN ('Drawing (Personal Withdrawal)', 'Withdrawal') THEN pt.amount ELSE 0 END), 0) as total_drawings,
            p.status, 
            p.notes 
          FROM partners p 
          LEFT JOIN partner_transactions pt ON p.id = pt.partner_id 
          WHERE 1=1
        `
        if (status) {
          params.push(status)
          sql += ` AND p.status = $${params.length}`
        }
        sql += ' GROUP BY p.id, p.name, p.mobile_number, p.profit_share_percentage, p.opening_balance, p.current_balance, p.status, p.notes ORDER BY p.id ASC'
        break
      }

      case 'factory-summary': {
        // Executive factory summary across key domains
        const [empStats, rollStats, cuttingStats, cashStats, partnerStats] = await Promise.all([
          query(`SELECT COUNT(*) as total_employees, COUNT(*) FILTER (WHERE status = 'Active') as active_employees FROM employees`),
          query(`SELECT COUNT(*) as total_rolls, COALESCE(SUM(received_meter), 0) as total_received_m, COALESCE(SUM(remaining_meter), 0) as in_stock_m FROM rolls`),
          query(`SELECT COUNT(*) as total_lots, COALESCE(SUM(piece_count), 0) as total_pieces FROM cutting_entries`),
          query(`SELECT COALESCE(SUM(income_amount), 0) as total_inflows, COALESCE(SUM(out_amount), 0) as total_outflows FROM cash_book_ledger`),
          query(`SELECT COUNT(*) as total_partners, COALESCE(SUM(current_balance), 0) as total_partner_equity FROM partners`)
        ])

        const latestBalRes = await query(`SELECT running_balance FROM cash_book_ledger ORDER BY transaction_date DESC, id DESC LIMIT 1`)
        const currentCashBal = latestBalRes.rows.length > 0 ? parseFloat(latestBalRes.rows[0].running_balance) : 0

        return [
          { metric: 'Total Employees', value: empStats.rows[0].total_employees, details: `${empStats.rows[0].active_employees} Active` },
          { metric: 'Fabric Rolls In Warehouse', value: rollStats.rows[0].total_rolls, details: `${rollStats.rows[0].in_stock_m} Meters Remaining` },
          { metric: 'Cutting Production', value: `${cuttingStats.rows[0].total_pieces} Pieces`, details: `${cuttingStats.rows[0].total_lots} Lots Cut` },
          { metric: 'Cashbook Inflows', value: `₹${parseFloat(cashStats.rows[0].total_inflows).toLocaleString('en-IN')}`, details: 'Total Company Cash In' },
          { metric: 'Cashbook Outflows', value: `₹${parseFloat(cashStats.rows[0].total_outflows).toLocaleString('en-IN')}`, details: 'Total Company Cash Out' },
          { metric: 'Current Factory Cash Balance', value: `₹${currentCashBal.toLocaleString('en-IN')}`, details: 'Grand Cash Desk Balance' },
          { metric: 'Partner Capital Equity', value: `₹${parseFloat(partnerStats.rows[0].total_partner_equity).toLocaleString('en-IN')}`, details: `${partnerStats.rows[0].total_partners} Partners Total` }
        ]
      }

      default: {
        sql = 'SELECT * FROM cash_book_ledger ORDER BY transaction_date DESC, id DESC LIMIT 100'
      }
    }

    const res = await query(sql, params)
    return res.rows
  }

  /**
   * Generates a fully formatted Excel workbook buffer (.xlsx) using ExcelJS.
   */
  static async generateExcel(category: string, filters: ReportFilterParams = {}): Promise<Buffer> {
    const data = await this.exportData(category, filters)
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'RD Jeans Factory Management System'
    workbook.created = new Date()

    const catName = category.toUpperCase().replace('-', ' ')
    const worksheet = workbook.addWorksheet(`${category.slice(0, 30)} Report`)

    // Title & Metadata
    worksheet.mergeCells('A1:G1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `RD JEANS FACTORY - ${catName} REPORT`
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
    data.forEach((rowObj, index) => {
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
    doc.text('RD JEANS FACTORY', 40, 30)

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
    const rows = data.map(item => keys.map(k => {
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
      didDrawPage: (dataObj) => {
        // Page footer
        const pageNum = doc.internal.pages.length - 1
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `Page ${pageNum} | RD Jeans Factory Confidential ERP Report`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        )
      }
    })

    return Buffer.from(doc.output('arraybuffer'))
  }
}
