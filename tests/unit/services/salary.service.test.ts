import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SalaryService } from '@/lib/services/salary'
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

describe('SalaryService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getById()', () => {
    it('should_filter_salaries_when_month_year_and_employee_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, salary_amount: '20000.00', employee_name: 'Dinesh' }]
      } as any)

      // Act
      const salaries = await SalaryService.getAll({
        employee_id: 10,
        salary_month: 5,
        salary_year: 2026,
        payment_method: 'Cash',
        handled_by: 'Rajubhai'
      })

      // Assert
      expect(salaries.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining([10, 5, 2026, 'Cash', 'Rajubhai'])
      )
    })

    it('should_return_salary_with_settled_upads_when_queried_by_id', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, salary_amount: '20000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 101, amount: '2000.00' }] } as any)

      // Act
      const sal = await SalaryService.getById(1)

      // Assert
      expect(sal).toBeDefined()
      expect(sal?.settled_upads.length).toBe(1)

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)
      expect(await SalaryService.getById(999)).toBeNull()
    })
  })

  describe('create()', () => {
    it('should_compute_net_payable_and_sync_cashbook_when_upad_deductions_applied', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ employee_name: 'Dinesh Kumar' }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 101, amount: '2000.00' },
            { id: 102, amount: '2000.00' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            employee_id: 10,
            salary_month: 5,
            salary_year: 2026,
            salary_amount: 20000,
            total_upad_deducted: 4000,
            net_payable: 16000,
            paid_amount: 10000,
            remaining_amount: 6000,
            handled_by: 'Rajubhai',
            payment_method: 'Cash',
            payment_date: '2026-05-31'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      const salaryInput = {
        employee_id: 10,
        salary_month: 5,
        salary_year: 2026,
        salary_amount: 20000,
        paid_amount: 10000,
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        payment_date: '2026-05-31',
        upad_ids: [101, 102]
      }

      // Act
      const result = await SalaryService.create(salaryInput)

      // Assert
      expect(result).toBeDefined()
      expect(result.net_payable).toBe(16000)
      expect(result.remaining_amount).toBe(6000)
      expect(result.total_upad_deducted).toBe(4000)
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-31',
        'Salary',
        'Dinesh Kumar',
        'Cash',
        0,
        10000,
        'Rajubhai',
        'Salary',
        1,
        undefined,
        mockClient,
        { salary_id: 1 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_throw_error_and_rollback_when_employee_does_not_exist', async () => {
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
        SalaryService.create({
          employee_id: 9999,
          salary_month: 5,
          salary_year: 2026,
          salary_amount: 15000,
          paid_amount: 15000,
          payment_method: 'Cash',
          handled_by: 'Rajubhai',
          payment_date: '2026-05-31'
        })
      ).rejects.toThrow('Employee with ID 9999 does not exist')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_handle_zero_upad_deductions_when_employee_has_no_active_advances', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ employee_name: 'Prakash' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 2,
            employee_id: 5,
            salary_amount: 18000,
            total_upad_deducted: 0,
            net_payable: 18000,
            paid_amount: 18000,
            remaining_amount: 0,
            payment_date: '2026-06-30',
            payment_method: 'Bank Transfer',
            handled_by: 'Dhruveshbhai'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const res = await SalaryService.create({
        employee_id: 5,
        salary_month: 6,
        salary_year: 2026,
        salary_amount: 18000,
        paid_amount: 18000,
        payment_method: 'Bank Transfer',
        handled_by: 'Dhruveshbhai',
        payment_date: '2026-06-30'
      })

      // Assert
      expect(res.remaining_amount).toBe(0)
      expect(res.net_payable).toBe(18000)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('update()', () => {
    it('should_update_paid_amount_and_sync_cashbook_when_amount_changes', async () => {
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
            id: 1,
            employee_id: 10,
            salary_amount: '20000.00',
            paid_amount: '10000.00',
            total_upad_deducted: '4000.00'
          }]
        })
        .mockResolvedValueOnce({ rows: [{ employee_name: 'Dinesh Kumar' }] })
        .mockResolvedValueOnce({
          rows: [{ id: 1, salary_amount: 22000, paid_amount: 12000 }]
        })
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const updated = await SalaryService.update(1, { paid_amount: 12000 })

      // Assert
      expect(updated.paid_amount).toBe(12000)
      expect(CashBookService.updateByReference).toHaveBeenCalledWith(
        'Salary',
        1,
        expect.objectContaining({ amount: 12000 }),
        mockClient
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('delete()', () => {
    it('should_revert_settled_upads_and_remove_cashbook_entry_when_salary_deleted', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 8 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await SalaryService.delete(8)

      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE upad_records"),
        [8]
      )
      expect(CashBookService.deleteByReference).toHaveBeenCalledWith('Salary', 8, mockClient)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('getEmployeeSummary()', () => {
    it('should_return_aggregated_stats_when_queried_for_employee', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 12, employee_name: 'Dinesh' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '120000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '110000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '10000.00' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, salary_amount: '20000.00' }] } as any)

      // Act
      const summary = await SalaryService.getEmployeeSummary(12)

      // Assert
      expect(summary.employee_id).toBe(12)
      expect(summary.total_salary).toBe(120000)
      expect(summary.total_paid).toBe(110000)
      expect(summary.total_remaining).toBe(10000)
      expect(summary.salary_history.length).toBe(1)
    })
  })
})
