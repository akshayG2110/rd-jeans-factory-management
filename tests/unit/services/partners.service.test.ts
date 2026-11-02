import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PartnerService } from '@/lib/services/partners'
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

describe('PartnerService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getSummary()', () => {
    it('should_calculate_equity_and_cash_handled_when_partners_queried', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              name: 'Rajubhai',
              opening_balance: '100000.00',
              profit_share_percentage: '50.00'
            }
          ]
        } as any)
        .mockResolvedValueOnce({
          rows: [{ invested: '50000.00', drawings: '20000.00' }]
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cash_in: '300000.00', cash_out: '180000.00' }]
        } as any)

      // Act
      const partners = await PartnerService.getAll()

      // Assert
      expect(partners.length).toBe(1)
      const raju = partners[0]
      expect(raju.name).toBe('Rajubhai')
      expect(raju.total_invested).toBe(50000)
      expect(raju.total_drawings).toBe(20000)
      expect(raju.equity_balance).toBe(130000)
      expect(raju.cash_in_handled).toBe(300000)
      expect(raju.cash_out_handled).toBe(180000)
      expect(raju.net_cash_handled).toBe(120000)
    })

    it('should_compute_firm_summary_totals_when_get_summary_invoked', async () => {
      // Arrange
      vi.mocked(db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('SELECT * FROM partners ORDER BY id ASC')) {
          return {
            rows: [
              { id: 1, name: 'Rajubhai', opening_balance: '100000.00' },
              { id: 2, name: 'Dhruveshbhai', opening_balance: '100000.00' }
            ]
          } as any
        }
        if (sql.includes('partner_transactions') && sql.includes('partner_id = $1')) {
          const pid = params?.[0]
          if (pid === 1) return { rows: [{ invested: '50000', drawings: '10000' }] } as any
          return { rows: [{ invested: '20000', drawings: '5000' }] } as any
        }
        if (sql.includes('cash_book_ledger')) {
          const pid = params?.[0]
          if (pid === 1) return { rows: [{ cash_in: '100000', cash_out: '50000' }] } as any
          return { rows: [{ cash_in: '80000', cash_out: '40000' }] } as any
        }
        return { rows: [] } as any
      })

      // Act
      const summary = await PartnerService.getSummary()

      // Assert
      expect(summary.total_partners).toBe(2)
      expect(summary.total_invested).toBe(70000)
      expect(summary.total_drawings).toBe(15000)
      expect(summary.rajubhai_total_income_handled).toBe(100000)
    })
  })

  describe('getByName() & create() & delete()', () => {
    it('should_return_partner_or_null_when_queried_by_name', async () => {
      // Arrange
      vi.mocked(db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('LIMIT 1')) {
          if (params?.[0] === 'Rajubhai') return { rows: [{ id: 1 }] } as any
          return { rows: [] } as any
        }
        if (sql.includes('SELECT * FROM partners WHERE id = $1')) {
          return { rows: [{ id: 1, name: 'Rajubhai', opening_balance: '100000' }] } as any
        }
        if (sql.includes('FROM partner_transactions WHERE partner_id')) {
          return { rows: [{ invested: '0', drawings: '0' }] } as any
        }
        if (sql.includes('FROM cash_book_ledger')) {
          return { rows: [{ cash_in: '0', cash_out: '0' }] } as any
        }
        if (sql.includes('FROM partner_transactions pt')) {
          return { rows: [] } as any
        }
        return { rows: [] } as any
      })

      // Act & Assert
      const partner = await PartnerService.getByName('Rajubhai')
      expect(partner?.name).toBe('Rajubhai')
      expect(await PartnerService.getByName('Unknown')).toBeNull()
    })

    it('should_create_partner_profile_when_valid_input_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('INSERT INTO partners')) {
          return { rows: [{ id: 3, name: 'Sanjaybhai', opening_balance: '50000.00' }] } as any
        }
        if (sql.includes('SELECT * FROM partners WHERE id = $1')) {
          return { rows: [{ id: 3, name: 'Sanjaybhai', opening_balance: '50000.00' }] } as any
        }
        if (sql.includes('FROM partner_transactions WHERE partner_id')) {
          return { rows: [{ invested: '0', drawings: '0' }] } as any
        }
        if (sql.includes('FROM cash_book_ledger')) {
          return { rows: [{ cash_in: '0', cash_out: '0' }] } as any
        }
        if (sql.includes('FROM partner_transactions pt')) {
          return { rows: [] } as any
        }
        return { rows: [] } as any
      })

      // Act
      const res = await PartnerService.create({
        name: 'Sanjaybhai',
        opening_balance: 50000
      })

      // Assert
      expect(res.id).toBe(3)
      expect(res.name).toBe('Sanjaybhai')
    })

    it('should_update_partner_and_return_updated_profile', async () => {
      // Arrange
      vi.mocked(db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('SELECT * FROM partners WHERE id = $1')) {
          return { rows: [{ id: 1, name: 'Rajubhai', profit_share_percentage: '50.00' }] } as any
        }
        if (sql.includes('UPDATE partners')) {
          return { rows: [] } as any
        }
        if (sql.includes('FROM partner_transactions WHERE partner_id')) {
          return { rows: [{ invested: '0', drawings: '0' }] } as any
        }
        if (sql.includes('FROM cash_book_ledger')) {
          return { rows: [{ cash_in: '0', cash_out: '0' }] } as any
        }
        if (sql.includes('FROM partner_transactions pt')) {
          return { rows: [] } as any
        }
        return { rows: [] } as any
      })

      // Act
      const updated = await PartnerService.update(1, { profit_share_percentage: 60 })

      // Assert
      expect(updated).toBeDefined()
      expect(updated?.id).toBe(1)
    })

    it('should_return_null_when_updating_non_existent_partner', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const res = await PartnerService.update(999, { name: 'Non Existent' })

      // Assert
      expect(res).toBeNull()
    })

    it('should_delete_partner_and_return_deleted_row', async () => {
      // Arrange
      vi.mocked(db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('SELECT * FROM partners WHERE id = $1')) {
          return { rows: [{ id: 1, name: 'Rajubhai' }] } as any
        }
        if (sql.includes('DELETE FROM partners')) {
          return { rows: [] } as any
        }
        if (sql.includes('FROM partner_transactions WHERE partner_id')) {
          return { rows: [{ invested: '0', drawings: '0' }] } as any
        }
        if (sql.includes('FROM cash_book_ledger')) {
          return { rows: [{ cash_in: '0', cash_out: '0' }] } as any
        }
        if (sql.includes('FROM partner_transactions pt')) {
          return { rows: [] } as any
        }
        return { rows: [] } as any
      })

      // Act
      const deleted = await PartnerService.delete(1)

      // Assert
      expect(deleted?.id).toBe(1)
    })
  })

  describe('logTransaction()', () => {
    it('should_record_capital_investment_and_sync_cashbook_inflow_when_investment_logged', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Rajubhai', opening_balance: '100000.00' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 10,
            partner_id: 1,
            transaction_date: '2026-05-01',
            transaction_type: 'Capital Investment',
            amount: '50000.00',
            payment_method: 'Bank Transfer'
          }]
        })
        .mockResolvedValueOnce({ rows: [{ current_bal: '150000.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const tx = await PartnerService.logTransaction({
        partner_id: 1,
        transaction_date: '2026-05-01',
        transaction_type: 'Capital Investment',
        amount: 50000,
        payment_method: 'Bank Transfer'
      })

      // Assert
      expect(tx.id).toBe(10)
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-01',
        'Money In',
        'Capital Infusion (Rajubhai)',
        'Bank Transfer',
        50000,
        0,
        'Rajubhai',
        'Partner Capital',
        10,
        expect.any(String),
        mockClient,
        { partner_id: 1 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should_record_personal_drawing_and_sync_cashbook_outflow_when_drawing_logged', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Dhruveshbhai', opening_balance: '100000.00' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 11,
            partner_id: 2,
            transaction_date: '2026-05-05',
            transaction_type: 'Drawing (Personal Withdrawal)',
            amount: '15000.00',
            payment_method: 'Cash'
          }]
        })
        .mockResolvedValueOnce({ rows: [{ current_bal: '85000.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await PartnerService.logTransaction({
        partner_id: 2,
        transaction_date: '2026-05-05',
        transaction_type: 'Drawing (Personal Withdrawal)',
        amount: 15000,
        payment_method: 'Cash'
      })

      // Assert
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-05',
        'Money Out',
        'Partner Drawing (Dhruveshbhai)',
        'Cash',
        0,
        15000,
        'Dhruveshbhai',
        'Partner Drawing',
        11,
        expect.any(String),
        mockClient,
        { partner_id: 2 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should_rollback_transaction_and_throw_error_when_log_transaction_fails', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Fatal partner insert failure'))

      // Act & Assert
      await expect(
        PartnerService.logTransaction({
          partner_id: 1,
          transaction_date: '2026-05-01',
          transaction_type: 'Capital Investment',
          amount: 50000
        })
      ).rejects.toThrow('Fatal partner insert failure')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('getTransactions()', () => {
    it('should_query_cashbook_transactions_with_partner_filter_when_specified', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, handled_by: 'Rajubhai', amount: 5000 }]
      } as any)

      // Act
      const res = await PartnerService.getTransactions('Rajubhai')

      // Assert
      expect(res.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('c.handled_by ILIKE $1 OR p.name ILIKE $1'),
        ['%Rajubhai%']
      )
    })

    it('should_query_all_transactions_when_no_partner_filter_specified', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const res = await PartnerService.getTransactions('all')

      // Assert
      expect(res).toEqual([])
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*, p.name as partner_name'),
        []
      )
    })
  })
})
