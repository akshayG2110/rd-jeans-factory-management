import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpadService } from '@/lib/services/upad'
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

describe('UpadService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create()', () => {
    it('should_create_upad_record_and_sync_cashbook_when_valid_advance_requested', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ employee_name: 'Rajesh' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 201,
            employee_id: 5,
            date: '2026-05-15',
            amount: '3500.00',
            payment_method: 'Cash',
            handled_by: 'Rajubhai',
            notes: 'Medical advance'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const result = await UpadService.create({
        employee_id: 5,
        date: '2026-05-15',
        amount: 3500,
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        notes: 'Medical advance'
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(201)
      expect(result.employee_name).toBe('Rajesh')
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-15',
        'Upad',
        'Rajesh',
        'Cash',
        0,
        3500,
        'Rajubhai',
        'Upad',
        201,
        'Medical advance',
        mockClient,
        { upad_id: 201 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_throw_error_and_rollback_when_worker_does_not_exist', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act & Assert
      await expect(
        UpadService.create({
          employee_id: 9999,
          date: '2026-05-15',
          amount: 2000,
          payment_method: 'Cash',
          handled_by: 'Rajubhai'
        })
      ).rejects.toThrow('Employee with ID 9999 does not exist')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('update()', () => {
    it('should_throw_error_and_rollback_when_employee_does_not_exist_during_update', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 50, employee_id: 8 }] })
        .mockResolvedValueOnce({ rows: [] })

      // Act & Assert
      await expect(
        UpadService.update(50, { employee_id: 999 })
      ).rejects.toThrow('Employee with ID 999 does not exist')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_update_upad_record_and_sync_cashbook_when_pending_advance_modified', async () => {
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
            id: 55,
            employee_id: 3,
            amount: '2000.00',
            date: '2026-05-10',
            payment_method: 'Cash',
            handled_by: 'Rajubhai',
            notes: 'Old notes'
          }]
        })
        .mockResolvedValueOnce({ rows: [{ employee_name: 'Suresh' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 55,
            amount: '2500.00',
            date: '2026-05-10',
            payment_method: 'Cash',
            handled_by: 'Rajubhai'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const res = await UpadService.update(55, { amount: 2500 })

      // Assert
      expect(res.amount).toBe('2500.00')
      expect(CashBookService.updateByReference).toHaveBeenCalledWith(
        'Upad',
        55,
        expect.objectContaining({ amount: 2500, isIncome: false, name: 'Suresh' }),
        mockClient
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('delete()', () => {
    it('should_throw_error_and_prevent_deletion_when_upad_is_settled_in_salary', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 60, status: 'Settled', settled_in_salary_id: 42 }] })

      // Act & Assert
      await expect(UpadService.delete(60)).rejects.toThrow(
        'Cannot delete Upad advance #60 because it was deducted in Salary settlement #42'
      )
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('should_delete_record_and_remove_cashbook_entry_when_pending_upad_deleted', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 65, status: 'Pending' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await UpadService.delete(65)

      // Assert
      expect(CashBookService.deleteByReference).toHaveBeenCalledWith('Upad', 65, mockClient)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('getEmployeeSummary()', () => {
    it('should_aggregate_employee_totals_when_summary_queried', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 3, employee_name: 'Ramesh' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '15000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '6000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '9000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '3000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '3000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 10, amount: '3000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 10, amount: '3000.00' }] } as any)

      // Act
      const summary = await UpadService.getEmployeeSummary(3)

      // Assert
      expect(summary.employee_id).toBe(3)
      expect(summary.total_upad).toBe(15000)
      expect(summary.unsettled_upad).toBe(6000)
      expect(summary.settled_upad).toBe(9000)
      expect(summary.current_month_upad).toBe(3000)
    })
  })

  describe('getAll() & getById()', () => {
    it('should_query_upad_records_with_all_filters_when_specified', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 10, amount: '3000.00', status: 'Pending', employee_name: 'Ramesh' }]
      } as any)

      // Act
      const records = await UpadService.getAll({
        employee_id: 3,
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        status: 'Pending',
        settled_in_salary_id: 12
      })

      // Assert
      expect(records.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM upad_records u'),
        [3, '2026-05-01', '2026-05-31', 'Cash', 'Rajubhai', 'Pending', 12]
      )
    })

    it('should_return_upad_by_id_or_null_when_queried', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 10, amount: '3000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      expect(await UpadService.getById(10)).toEqual({ id: 10, amount: '3000.00' })
      expect(await UpadService.getById(999)).toBeNull()
    })
  })
})
