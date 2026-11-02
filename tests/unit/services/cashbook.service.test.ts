import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CashBookService } from '@/lib/services/cashbook'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('CashBookService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recalculateBalancesFrom()', () => {
    it('should_execute_sql_window_function_when_start_id_provided', async () => {
      // Arrange
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
      const client = { query: mockQuery }

      // Act
      await CashBookService.recalculateBalancesFrom(15, client)

      // Assert
      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SUM(income_amount - out_amount) OVER'),
        [15]
      )
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.id = u.id AND c.id >= $1'),
        [15]
      )
    })

    it('should_use_default_db_query_when_custom_client_not_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      await CashBookService.recalculateBalancesFrom(1)

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SUM(income_amount - out_amount) OVER'),
        [1]
      )
    })
  })

  describe('logTransaction()', () => {
    it('should_calculate_running_balance_and_insert_when_logging_valid_transaction', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({ rows: [{ running_balance: '50000.00' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 101,
            transaction_date: '2026-05-10',
            transaction_type: 'Upad',
            name: 'Ramesh Patel',
            payment_method: 'Cash',
            income_amount: '0.00',
            out_amount: '3000.00',
            running_balance: '47000.00',
            handled_by: 'Rajubhai',
            reference_module: 'upad',
            reference_id: 12
          }]
        })
      const client = { query: mockQuery }

      // Act
      const result = await CashBookService.logTransaction(
        '2026-05-10',
        'Upad',
        'Ramesh Patel',
        'Cash',
        0,
        3000,
        'Rajubhai',
        'upad',
        12,
        'Weekly advance',
        client
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(101)
      expect(result.running_balance).toBe('47000.00')
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO cash_book_ledger'),
        expect.arrayContaining([
          '2026-05-10',
          'Upad',
          'Ramesh Patel',
          'Cash',
          0,
          3000,
          47000,
          'Rajubhai',
          'upad',
          12
        ])
      )
    })

    it('should_default_previous_balance_to_zero_when_cashbook_is_empty', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            income_amount: '10000.00',
            out_amount: '0.00',
            running_balance: '10000.00'
          }]
        })
      const client = { query: mockQuery }

      // Act
      await CashBookService.logTransaction(
        '2026-05-01',
        'Capital Inflow',
        'Rajubhai',
        'Cash',
        10000,
        0,
        'Rajubhai',
        'partner',
        1,
        null,
        client
      )

      // Assert
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.arrayContaining([10000, 0, 10000])
      )
    })

    it('should_derive_foreign_keys_correctly_when_reference_module_is_salary', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({ rows: [{ running_balance: '1000.00' }] })
        .mockResolvedValueOnce({ rows: [{ id: 5 }] })
      const client = { query: mockQuery }

      // Act
      await CashBookService.logTransaction(
        '2026-05-01',
        'Salary',
        'Worker 1',
        'Cash',
        0,
        1000,
        'Dhruveshbhai',
        'salary',
        99,
        null,
        client
      )

      // Assert
      const insertParams = mockQuery.mock.calls[1][1]
      expect(insertParams[10]).toBeNull() // upad_id
      expect(insertParams[11]).toBe(99)   // salary_id
    })
  })

  describe('updateByReference()', () => {
    it('should_return_null_when_reference_entry_does_not_exist', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const result = await CashBookService.updateByReference('upad', 9999, { amount: 500 })

      // Assert
      expect(result).toBeNull()
    })

    it('should_update_record_and_trigger_recalculation_when_reference_entry_exists', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: 45,
            name: 'Original Party',
            payment_method: 'Cash',
            handled_by: 'Rajubhai',
            transaction_date: '2026-05-02',
            income_amount: '0.00',
            out_amount: '2000.00'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 45,
            out_amount: '2500.00',
            name: 'Updated Party'
          }]
        })
      const client = { query: mockQuery }

      // Act
      const result = await CashBookService.updateByReference(
        'upad',
        12,
        {
          name: 'Updated Party',
          amount: 2500,
          isIncome: false
        },
        client
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(45)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cash_book_ledger'),
        expect.arrayContaining(['Updated Party', 0, 2500, 45])
      )
    })
  })

  describe('deleteByReference()', () => {
    it('should_do_nothing_when_deleting_non_existent_reference_entry', async () => {
      // Arrange
      const mockQuery = vi.fn().mockResolvedValueOnce({ rows: [] })
      const client = { query: mockQuery }

      // Act
      await CashBookService.deleteByReference('upad', 888, client)

      // Assert
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('should_delete_entry_and_recalculate_balance_when_valid_reference_entry_deleted', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 72 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
      const client = { query: mockQuery }

      // Act
      await CashBookService.deleteByReference('upad', 10, client)

      // Assert
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM cash_book_ledger WHERE id = $1',
        [72]
      )
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('SUM(income_amount - out_amount) OVER'),
        [72]
      )
    })
  })

  describe('Foreign Key Finders & Dashboard Summary', () => {
    it('should_return_records_when_queried_by_specific_foreign_keys', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, upad_id: 10 }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 2, salary_id: 20 }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 3, seth_payment_id: 30 }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 4, income_id: 40 }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 5, expense_id: 50 }] } as any)

      // Act & Assert
      expect((await CashBookService.getByUpadId(10))?.id).toBe(1)
      expect((await CashBookService.getBySalaryId(20))?.id).toBe(2)
      expect((await CashBookService.getBySethPaymentId(30))?.id).toBe(3)
      expect((await CashBookService.getByIncomeId(40))?.id).toBe(4)
      expect((await CashBookService.getByExpenseId(50))?.id).toBe(5)
    })

    it('should_compute_dashboard_summary_accurately_when_metrics_queried', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ running_balance: '450000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '25000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '12000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '320000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '210000.00' }] } as any)

      // Act
      const summary = await CashBookService.getDashboardSummary()

      // Assert
      expect(summary.current_cash_balance).toBe(450000)
      expect(summary.today_cash_in).toBe(25000)
      expect(summary.today_cash_out).toBe(12000)
      expect(summary.monthly_cash_in).toBe(320000)
      expect(summary.monthly_cash_out).toBe(210000)
    })
  })

  describe('getAll() with complex multi-criteria filters', () => {
    it('should_query_cashbook_with_all_filter_options_when_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 10, transaction_type: 'Salary', payment_method: 'Cash', handled_by: 'Rajubhai' }]
      } as any)

      // Act
      const entries = await CashBookService.getAll({
        transaction_type: 'Salary',
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        search: 'Worker'
      })

      // Assert
      expect(entries.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1 AND transaction_type = $1 AND payment_method = $2 AND handled_by = $3 AND transaction_date >= $4 AND transaction_date <= $5 AND (name ILIKE $6 OR notes ILIKE $6)'),
        ['Salary', 'Cash', 'Rajubhai', '2026-05-01', '2026-05-31', '%Worker%']
      )
    })

    it('should_update_reference_as_income_when_is_income_flag_is_true', async () => {
      // Arrange
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ id: 90, income_amount: '0.00', out_amount: '500.00' }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 90, income_amount: '1200.00', out_amount: '0.00' }] })
      const client = { query: mockQuery }

      // Act
      const res = await CashBookService.updateByReference(
        'income',
        5,
        { amount: 1200, isIncome: true },
        client
      )

      // Assert
      expect(res).toBeDefined()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cash_book_ledger'),
        expect.arrayContaining([1200, 0, 90])
      )
    })
  })
})
