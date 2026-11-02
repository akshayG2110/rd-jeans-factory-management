import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportService } from '@/lib/services/reports'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('ReportService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData()', () => {
    it('should_query_cashbook_transactions_when_date_and_handler_filters_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            date: '2026-05-01',
            type: 'Income',
            party_name: 'Scrap Buyer',
            income: '5000.00',
            out: '0.00',
            balance: '5000.00'
          }
        ]
      } as any)

      // Act
      const rows = await ReportService.exportData('cashbook', {
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        handled_by: 'Rajubhai'
      })

      // Assert
      expect(rows.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM cash_book_ledger'),
        expect.arrayContaining(['2026-05-01', '2026-05-31', 'Rajubhai'])
      )
    })

    it('should_filter_employees_when_status_parameter_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            employee_name: 'Babubhai',
            role: 'Cutting Worker',
            status: 'Active'
          }
        ]
      } as any)

      // Act
      const rows = await ReportService.exportData('employees', { status: 'Active' })

      // Assert
      expect(rows.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM employees'),
        ['Active']
      )
    })

    it('should_compile_factory_summary_when_requested', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ total_employees: 48, active_employees: 45 }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_rolls: 14, in_stock_m: 850 }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_lots: 20, total_pieces: 6000 }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_inflows: '900000', total_outflows: '600000' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_partners: 2, total_partner_equity: '250000' }] } as any)
        .mockResolvedValueOnce({ rows: [{ running_balance: '300000' }] } as any)

      // Act
      const summary = await ReportService.exportData('factory-summary')

      // Assert
      expect(summary.length).toBe(7)
      expect(summary[0].metric).toBe('Total Employees')
      expect(summary[0].value).toBe(48)
    })

    it('should_query_salary_reports_with_employee_and_date_filters', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 1, salary_amount: '20000' }] } as any)

      // Act
      const res = await ReportService.exportData('salary', {
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        employee_id: '10',
        handled_by: 'Rajubhai'
      })

      // Assert
      expect(res.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM salaries s'),
        expect.arrayContaining(['2026-05-01', '2026-05-31', 10, 'Rajubhai'])
      )
    })

    it('should_query_cutting_and_income_and_expense_reports_with_filters', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 5, lot_number: 'LOT-500' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 6, income_source: 'Scrap' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 7, expense_category: 'Tea' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 8 }] } as any)

      // Act
      const cut = await ReportService.exportData('cutting', { lot_number: 'LOT-500', roll_number: 'RL-10' })
      const inc = await ReportService.exportData('income', { income_source: 'Scrap', handled_by: 'Raju' })
      const exp = await ReportService.exportData('expenses', { expense_category: 'Tea', handled_by: 'Raju' })
      const def = await ReportService.exportData('unknown-category')

      // Assert
      expect(cut.length).toBe(1)
      expect(inc.length).toBe(1)
      expect(exp.length).toBe(1)
      expect(def.length).toBe(1)
    })
  })

  describe('generateExcel() & generatePdf()', () => {
    it('should_produce_binary_buffer_when_excel_export_requested', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [
          { id: 1, date: '2026-05-01', party_name: 'Test Client', income: 10000, out: 0, balance: 10000 }
        ]
      } as any)

      // Act
      const buffer = await ReportService.generateExcel('cashbook')

      // Assert
      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should_produce_binary_buffer_when_pdf_export_requested', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [
          { id: 1, date: '2026-05-01', party_name: 'Test Client', income: 10000, out: 0, balance: 10000 }
        ]
      } as any)

      // Act
      const buffer = await ReportService.generatePdf('cashbook')

      // Assert
      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should_handle_empty_datasets_safely_when_generating_excel_and_pdf', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const excelBuffer = await ReportService.generateExcel('cashbook')
      const pdfBuffer = await ReportService.generatePdf('cashbook')

      // Assert
      expect(excelBuffer.length).toBeGreaterThan(0)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })
  })
})
