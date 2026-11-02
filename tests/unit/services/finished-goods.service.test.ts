import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinishedGoodsService } from '@/lib/services/finished-goods'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('FinishedGoodsService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll() & getById() & getByCuttingId()', () => {
    it('should_filter_finished_goods_when_cutting_seth_and_status_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, lot_number: 'LOT-500', total_pieces: 150 }]
      } as any)

      // Act
      const list = await FinishedGoodsService.getAll({
        cutting_id: 10,
        seth_id: 2,
        status: 'Cut',
        size: '32',
        search: 'LOT-500'
      })

      // Assert
      expect(list.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining([10, 2, 'Cut', '32', '%LOT-500%'])
      )
    })

    it('should_return_batches_when_queried_by_cutting_id', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, cutting_id: 10 }]
      } as any)

      // Act
      const res = await FinishedGoodsService.getByCuttingId(10)

      // Assert
      expect(res.length).toBe(1)
    })

    it('should_return_finished_goods_or_null_when_queried_by_id', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, lot_number: 'LOT-500' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      expect(await FinishedGoodsService.getById(1)).toEqual({ id: 1, lot_number: 'LOT-500' })
      expect(await FinishedGoodsService.getById(999)).toBeNull()
    })
  })

  describe('create()', () => {
    it('should_create_garment_batch_with_cut_status_when_valid_input_provided', async () => {
      // Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 10, lot_number: 'LOT-500', seth_id: 2 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }]
        })
        .mockResolvedValueOnce({ rows: [] })

      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{
          id: 1,
          cutting_id: 10,
          seth_id: 2,
          lot_number: 'LOT-500',
          item_name: 'Men Slim Fit Denim',
          size: '32',
          total_pieces: 150,
          status: 'Cut'
        }]
      } as any)

      // Act
      const res = await FinishedGoodsService.create({
        cutting_id: 10,
        seth_id: 2,
        lot_number: 'LOT-500',
        item_name: 'Men Slim Fit Denim',
        size: '32',
        total_pieces: 150
      })

      // Assert
      expect(res.id).toBe(1)
      expect(res.total_pieces).toBe(150)
      expect(res.status).toBe('Cut')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('updateStage()', () => {
    it('should_transition_status_to_dispatched_when_dispatch_payload_provided', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{ id: 1, seth_id: 2, total_pieces: 150, status: 'Ready' }]
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'Dispatched', dispatch_date: '2026-05-25' }]
        } as any)

      // Act
      const updated = await FinishedGoodsService.updateStage(1, {
        status: 'Dispatched',
        dispatch_date: '2026-05-25'
      })

      // Assert
      expect(updated.status).toBe('Dispatched')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE finished_goods'),
        expect.arrayContaining(['Dispatched', '2026-05-25', 1])
      )
    })
  })

  describe('delete()', () => {
    it('should_delete_batch_and_return_deleted_row_when_id_provided', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, lot_number: 'LOT-500' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const deleted = await FinishedGoodsService.delete(1)

      // Assert
      expect(deleted.id).toBe(1)
      expect(db.query).toHaveBeenCalledWith('DELETE FROM finished_goods WHERE id = $1', [1])
    })
  })

  describe('getSummary()', () => {
    it('should_aggregate_all_pipeline_counts_when_summary_queried', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{
          total_cut: '5000',
          total_in_stitching: '2000',
          total_ready: '1500',
          total_dispatched: '1200',
          total_rejected: '300',
          total_batches: '25'
        }]
      } as any)

      // Act
      const summary = await FinishedGoodsService.getSummary()

      // Assert
      expect(summary.totalCut).toBe(5000)
      expect(summary.totalInStitching).toBe(2000)
      expect(summary.totalReady).toBe(1500)
      expect(summary.totalDispatched).toBe(1200)
      expect(summary.totalRejected).toBe(300)
      expect(summary.totalBatches).toBe(25)
    })
  })
})
