import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpenseService } from '@/lib/services/expenses'
import { CashBookService } from '@/lib/services/cashbook'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

vi.mock('@/lib/services/cashbook', () => ({
  CashBookService: {
    logTransaction: vi.fn(),
    updateByReference: vi.fn(),
    deleteByReference: vi.fn()
  }
}))

describe('ExpenseService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getById()', () => {
    it('should_filter_expenses_when_category_method_and_date_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, party_name: 'Electric Board', amount: '8000.00' }]
      } as any)

      // Act
      const expenses = await ExpenseService.getAll({
        expense_category: 'Electricity',
        payment_method: 'Bank Transfer',
        handled_by: 'Rajubhai',
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        search: 'Electric'
      })

      // Assert
      expect(expenses.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining(['Electricity', 'Bank Transfer', 'Rajubhai', '2026-05-01', '2026-05-31', '%Electric%'])
      )
    })

    it('should_return_expense_or_null_when_queried_by_id', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 15, party_name: 'Gujarat Sewing' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      expect(await ExpenseService.getById(15)).toEqual({ id: 15, party_name: 'Gujarat Sewing' })
      expect(await ExpenseService.getById(999)).toBeNull()
    })
  })

  describe('create()', () => {
    it('should_create_expense_and_sync_cashbook_outflow_when_valid_input_provided', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 15,
            expense_date: '2026-05-02',
            expense_category: 'Machine Maintenance',
            party_name: 'Gujarat Sewing Machine Co',
            amount: '4500.00',
            payment_method: 'Cash',
            handled_by: 'Rajubhai'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const expense = await ExpenseService.create({
        expense_date: '2026-05-02',
        expense_category: 'Machine Maintenance',
        party_name: 'Gujarat Sewing Machine Co',
        amount: 4500,
        payment_method: 'Cash',
        handled_by: 'Rajubhai'
      })

      // Assert
      expect(expense.id).toBe(15)
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-02',
        'Machine Maintenance',
        'Gujarat Sewing Machine Co',
        'Cash',
        0,
        4500,
        'Rajubhai',
        'Expense',
        15,
        undefined,
        mockClient,
        { expense_id: 15 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('update()', () => {
    it('should_update_expense_and_sync_cashbook_when_amount_modified', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 15,
            expense_date: '2026-05-02',
            expense_category: 'Maintenance',
            party_name: 'Gujarat Sewing',
            amount: '4500.00',
            payment_method: 'Cash',
            handled_by: 'Rajubhai'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ id: 15, party_name: 'Gujarat Sewing', amount: '5000.00' }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await ExpenseService.update(15, { amount: 5000 })

      // Assert
      expect(CashBookService.updateByReference).toHaveBeenCalledWith(
        'Expense',
        15,
        expect.objectContaining({ amount: 5000, isIncome: false }),
        mockClient
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should_return_null_when_updating_non_existent_expense', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      // Act
      const res = await ExpenseService.update(999, { amount: 100 })

      // Assert
      expect(res).toBeNull()
    })
  })

  describe('delete()', () => {
    it('should_delete_expense_and_remove_linked_cashbook_entry_when_id_provided', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 15 }] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await ExpenseService.delete(15)

      // Assert
      expect(CashBookService.deleteByReference).toHaveBeenCalledWith('Expense', 15, mockClient)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })
})
