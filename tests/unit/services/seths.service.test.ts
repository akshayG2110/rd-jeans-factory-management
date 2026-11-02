import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SethService } from '@/lib/services/seths'
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

describe('SethService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create()', () => {
    it('should_create_client_profile_with_active_status_when_valid_input_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{
          id: 1,
          seth_name: 'Mahavir Apparels',
          mobile_number: '9825012345',
          status: 'Active'
        }]
      } as any)

      // Act
      const seth = await SethService.create({
        seth_name: 'Mahavir Apparels',
        mobile_number: '9825012345'
      })

      // Assert
      expect(seth.id).toBe(1)
      expect(seth.seth_name).toBe('Mahavir Apparels')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO seths'),
        ['Mahavir Apparels', '9825012345', null, null, 'Active']
      )
    })
  })

  describe('getAll() & getById()', () => {
    it('should_filter_seths_when_search_and_status_criteria_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, seth_name: 'Mahavir Apparels' }]
      } as any)

      // Act
      const seths = await SethService.getAll('Mahavir', 'Active')

      // Assert
      expect(seths.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        ['%Mahavir%', 'Active']
      )
    })

    it('should_return_seth_or_null_when_queried_by_id', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, seth_name: 'Mahavir' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      expect(await SethService.getById(1)).toEqual({ id: 1, seth_name: 'Mahavir' })
      expect(await SethService.getById(999)).toBeNull()
    })
  })

  describe('update()', () => {
    it('should_preserve_unmodified_fields_when_partial_update_requested', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{ id: 1, seth_name: 'Mahavir', mobile_number: '98250', status: 'Active' }]
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 1, seth_name: 'Mahavir Updated', mobile_number: '98250', status: 'Active' }]
        } as any)

      // Act
      const updated = await SethService.update(1, { seth_name: 'Mahavir Updated' })

      // Assert
      expect(updated.seth_name).toBe('Mahavir Updated')
    })

    it('should_return_null_when_updating_non_existent_seth', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const res = await SethService.update(999, { seth_name: 'Ghost' })

      // Assert
      expect(res).toBeNull()
    })
  })

  describe('delete()', () => {
    it('should_delete_client_cleanly_when_valid_id_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, seth_name: 'Mahavir Apparels' }]
      } as any)

      // Act
      const deleted = await SethService.delete(1)

      // Assert
      expect(deleted.id).toBe(1)
      expect(db.query).toHaveBeenCalledWith('DELETE FROM seths WHERE id = $1 RETURNING *', [1])
    })
  })

  describe('addPayment() & getPayments()', () => {
    it('should_log_job_work_payment_and_sync_cashbook_inflow_when_payment_recorded', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, seth_name: 'Mahavir Apparels' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 80,
            seth_id: 1,
            payment_date: '2026-05-12',
            amount: '75000.00',
            payment_method: 'Cheque',
            handled_by: 'Dhruveshbhai'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      const payment = await SethService.addPayment(1, {
        payment_date: '2026-05-12',
        amount: 75000,
        payment_method: 'Cheque',
        handled_by: 'Dhruveshbhai'
      })

      // Assert
      expect(payment.id).toBe(80)
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-05-12',
        'Seth Payment',
        'Mahavir Apparels',
        'Cheque',
        75000,
        0,
        'Dhruveshbhai',
        'Seth Payment',
        80,
        undefined,
        mockClient,
        { seth_payment_id: 80 }
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_return_payment_history_when_queried_for_seth', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, amount: '50000.00', seth_id: 1 }]
      } as any)

      // Act
      const payments = await SethService.getPayments(1)

      // Assert
      expect(payments.length).toBe(1)
      expect(payments[0].amount).toBe('50000.00')
    })
  })
})
