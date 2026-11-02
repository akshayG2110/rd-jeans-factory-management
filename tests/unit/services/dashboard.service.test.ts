import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardService } from '@/lib/services/dashboard'
import { CashBookService } from '@/lib/services/cashbook'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

vi.mock('@/lib/services/cashbook', () => ({
  CashBookService: {
    getDashboardSummary: vi.fn()
  }
}))

describe('DashboardService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMetrics()', () => {
    it('should_aggregate_all_factory_kpis_when_metrics_queried', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '48' }] } as any) // employees
        .mockResolvedValueOnce({ rows: [{ total: '62500.00' }] } as any) // upad
        .mockResolvedValueOnce({ rows: [{ total: '480000.00' }] } as any) // salary
        .mockResolvedValueOnce({ rows: [{ count: '14' }] } as any) // active rolls
        .mockResolvedValueOnce({ rows: [{ total: '8750' }] } as any) // cutting pieces
        .mockResolvedValueOnce({ rows: [{ total: '615000.00' }] } as any) // expenses
        .mockResolvedValueOnce({ rows: [{ total: '920000.00' }] } as any) // income
        .mockResolvedValueOnce({ // recent activities
          rows: [
            { id: 10, name: 'Sample Transaction', income_amount: '5000.00', out_amount: '0.00' }
          ]
        } as any)

      vi.mocked(CashBookService.getDashboardSummary).mockResolvedValueOnce({
        current_cash_balance: 305000,
        today_cash_in: 50000,
        today_cash_out: 20000,
        monthly_cash_in: 200000,
        monthly_cash_out: 100000
      })

      // Act
      const metrics = await DashboardService.getMetrics()

      // Assert
      expect(metrics.total_employees).toBe(48)
      expect(metrics.total_upad).toBe(62500)
      expect(metrics.total_salary).toBe(480000)
      expect(metrics.active_rolls).toBe(14)
      expect(metrics.total_pieces_cut).toBe(8750)
      expect(metrics.total_expenses).toBe(615000)
      expect(metrics.total_income).toBe(920000)
      expect(metrics.cash_summary.current_cash_balance).toBe(305000)
      expect(metrics.recent_activities.length).toBe(1)
    })

    it('should_return_zeroes_safely_when_database_tables_are_empty', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      vi.mocked(CashBookService.getDashboardSummary).mockResolvedValueOnce({
        current_cash_balance: 0,
        today_cash_in: 0,
        today_cash_out: 0,
        monthly_cash_in: 0,
        monthly_cash_out: 0
      })

      // Act
      const metrics = await DashboardService.getMetrics()

      // Assert
      expect(metrics.total_employees).toBe(0)
      expect(metrics.total_upad).toBe(0)
      expect(metrics.total_salary).toBe(0)
      expect(metrics.active_rolls).toBe(0)
      expect(metrics.total_pieces_cut).toBe(0)
      expect(metrics.cash_summary.current_cash_balance).toBe(0)
    })
  })
})
