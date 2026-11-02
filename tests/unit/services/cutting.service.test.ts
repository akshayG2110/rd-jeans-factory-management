import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CuttingService } from '@/lib/services/cutting'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('CuttingService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getById()', () => {
    it('should_filter_cutting_entries_when_search_parameters_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, lot_number: 'LOT-101', piece_count: 50 }]
      } as any)

      // Act
      const entries = await CuttingService.getAll({
        roll_id: 10,
        size: '32',
        sort_number: 'SN-1',
        date_from: '2026-05-01',
        date_to: '2026-05-31'
      })

      // Assert
      expect(entries.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining([10, '32', 'SN-1', '2026-05-01', '2026-05-31'])
      )
    })

    it('should_return_cutting_entry_with_finished_goods_when_valid_id_provided', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{ id: 1, lot_number: 'LOT-101' }]
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 50, item_name: 'Jeans' }]
        } as any)

      // Act
      const entry = await CuttingService.getById(1)

      // Assert
      expect(entry).toBeDefined()
      expect(entry?.finished_goods.length).toBe(1)

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)
      expect(await CuttingService.getById(999)).toBeNull()
    })
  })

  describe('create()', () => {
    it('should_update_roll_to_partially_used_and_create_goods_when_valid_cutting_registered', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ remaining_meter: '100.00' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            cutting_date: '2026-05-18',
            lot_number: 'LOT-501',
            roll_id: 20,
            meter_used: '40.00',
            piece_count: 35,
            size: '32'
          }]
        })
        .mockResolvedValueOnce({ rows: [{ seth_id: 2 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '40.00' }] })
        .mockResolvedValueOnce({ rows: [{ received_meter: '100.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            lot_number: 'LOT-501',
            piece_count: 35,
            meter_used: '40.00'
          }]
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      const cuttingInput = {
        cutting_date: '2026-05-18',
        lot_number: 'LOT-501',
        roll_id: 20,
        meter_used: 40,
        piece_count: 35,
        size: '32',
        pana: 60,
        average: 1.14
      }

      // Act
      const result = await CuttingService.create(cuttingInput)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.lot_number).toBe('LOT-501')
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rolls SET used_meter = $1, remaining_meter = $2, status = $3'),
        [40, 60, 'Partially Used', 20]
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should_transition_roll_status_to_completed_when_all_meters_consumed', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ remaining_meter: '60.00' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 2,
            lot_number: 'LOT-502',
            roll_id: 20,
            meter_used: '60.00',
            piece_count: 50
          }]
        })
        .mockResolvedValueOnce({ rows: [{ seth_id: 2 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '100.00' }] })
        .mockResolvedValueOnce({ rows: [{ received_meter: '100.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 2, lot_number: 'LOT-502' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      await CuttingService.create({
        cutting_date: '2026-05-19',
        lot_number: 'LOT-502',
        roll_id: 20,
        meter_used: 60,
        piece_count: 50,
        size: '34'
      })

      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rolls SET used_meter = $1, remaining_meter = $2, status = $3'),
        [100, 0, 'Completed', 20]
      )
    })

    it('should_throw_error_and_rollback_when_meter_used_exceeds_available_balance', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ remaining_meter: '15.00' }] })

      // Act & Assert
      await expect(
        CuttingService.create({
          cutting_date: '2026-05-20',
          lot_number: 'LOT-503',
          roll_id: 20,
          meter_used: 25,
          piece_count: 20,
          size: '36'
        })
      ).rejects.toThrow('only has 15m remaining')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('update()', () => {
    it('should_update_lot_and_recalculate_meters_when_valid_changes_submitted', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: 1, roll_id: 20, meter_used: '40.00' }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '45.00' }] })
        .mockResolvedValueOnce({ rows: [{ received_meter: '100.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, lot_number: 'LOT-UPDATED' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const updated = await CuttingService.update(1, { lot_number: 'LOT-UPDATED' })

      // Assert
      expect(updated.lot_number).toBe('LOT-UPDATED')
    })

    it('should_rollback_transaction_and_throw_when_update_query_fails', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Update database failure'))

      // Act & Assert
      await expect(CuttingService.update(1, { piece_count: 50 })).rejects.toThrow('Update database failure')
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('delete()', () => {
    it('should_restore_roll_meters_and_status_when_cutting_entry_deleted', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, roll_id: 20 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0.00' }] })
        .mockResolvedValueOnce({ rows: [{ received_meter: '100.00' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      // Act
      await CuttingService.delete(1)

      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rolls SET used_meter = $1, remaining_meter = $2, status = $3'),
        [0, 100, 'Available', 20]
      )
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('should_rollback_transaction_and_throw_when_delete_query_fails', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Delete database failure'))

      // Act & Assert
      await expect(CuttingService.delete(1)).rejects.toThrow('Delete database failure')
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })
})
