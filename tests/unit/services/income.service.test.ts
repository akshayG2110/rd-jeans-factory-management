import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IncomeService } from '@/lib/services/income'
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

describe('IncomeService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getById()', () => {
    it('should_filter_incomes_when_source_method_and_date_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, source_name: 'Scrap Buyer', amount: '12000.00' }]
      } as any)

      // Act
      const incomes = await IncomeService.getAll({
        income_source: 'Scrap',
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        search: 'Scrap'
      })

      // Assert
      expect(incomes.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining(['Scrap', 'Cash', 'Rajubhai', '2026-05-01', '2026-05-31', '%Scrap%'])
      )
    })

    it('should_return_income_or_null_when_queried_by_id', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 22, source_name: 'Recycler' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      expect(await IncomeService.getById(22)).toEqual({ id: 22, source_name: 'Recycler' })
      expect(await IncomeService.getById(999)).toBeNull()
    })
  })

  describe('create()', () => {
    it('should_record_revenue_and_sync_cashbook_inflow_when_valid_input_provided', async () => {
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
            id: 22,
            income_date: '2026-05-04',
            income_source: 'Fabric Scrap Sale',
            source_name: 'Ahmedabad Recyclers',
            amount: '18000.00',
            payment_method: 'Cash',
            handled_by: 'Rajubhai'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const income = await IncomeService.create({
        income_date: '2026-05-04',
        income_source: 'Fabric Scrap Sale',
        source_name: 'Ahmedabad Recyclers',
        amount: 18000,
        payment_method: 'Cash',
        handled_by: 'Rajubhai'
      })

      // Assert
      expect(income.id).toBe(22)
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-04',
        'Fabric Scrap Sale',
        'Ahmedabad Recyclers',
        'Cash',
        18000,
        0,
        'Rajubhai',
        'Income',
        22,
        undefined,
        mockClient,
        { income_id: 22 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('update()', () => {
    it('should_update_income_and_sync_cashbook_when_amount_modified', async () => {
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
            id: 22,
            income_date: '2026-05-04',
            income_source: 'Scrap',
            source_name: 'Ahmedabad Recyclers',
            amount: 18000,
            payment_method: 'Cash',
            handled_by: 'Rajubhai'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ id: 22, source_name: 'Ahmedabad Recyclers', amount: '20000.00' }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await IncomeService.update(22, { amount: 20000 })

      // Assert
      expect(CashBookService.updateByReference).toHaveBeenCalledWith(
        'Income',
        22,
        expect.objectContaining({ amount: 20000, isIncome: true }),
        mockClient
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should_return_null_when_updating_non_existent_income', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      // Act
      const res = await IncomeService.update(999, { amount: 100 })

      // Assert
      expect(res).toBeNull()
    })
  })

  describe('delete()', () => {
    it('should_delete_income_and_remove_cashbook_entry_when_id_provided', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 22 }] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await IncomeService.delete(22)

      // Assert
      expect(CashBookService.deleteByReference).toHaveBeenCalledWith('Income', 22, mockClient)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })
})
