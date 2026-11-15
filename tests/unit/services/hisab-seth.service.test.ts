import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SethHisabService } from '@/lib/services/hisab-seth'
import * as mongoModule from '@/lib/mongodb'
import { CashBookService } from '@/lib/services/cashbook'

vi.mock('@/lib/services/cashbook', () => ({
  CashBookService: {
    logTransaction: vi.fn(),
    deleteByReference: vi.fn()
  }
}))

describe('SethHisabService Unit Tests', () => {
  let mockDb: any
  let mockCollections: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCollections = {
      seths: {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, seth_name: 'Mahavir Seth', mobile_number: '9898000000', address: 'Surat' }
            ])
          })
        }),
        findOne: vi.fn().mockResolvedValue({ id: 1, seth_name: 'Mahavir Seth' })
      },
      rolls: {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                id: 10,
                roll_number: 'R-101',
                short_number: '101',
                seth_id: 1,
                fabric_type: 'Heavy Indigo Denim',
                received_meter: 400,
                used_meter: 200,
                remaining_meter: 200,
                status: 'Partially Used'
              }
            ])
          })
        }),
        findOne: vi.fn().mockResolvedValue({
          id: 10,
          roll_number: 'R-101',
          seth_id: 1,
          fabric_type: 'Heavy Indigo Denim',
          received_meter: 400,
          used_meter: 200,
          remaining_meter: 200
        })
      },
      cutting_entries: {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                id: 101,
                lot_number: 'LOT-901',
                cutting_date: '2026-11-10',
                roll_id: 10,
                meter_used: 200,
                piece_count: 150,
                size: '32',
                average: 1.33
              }
            ])
          })
        }),
        findOne: vi.fn().mockResolvedValue({
          id: 101,
          lot_number: 'LOT-901',
          cutting_date: '2026-11-10',
          roll_id: 10,
          meter_used: 200,
          piece_count: 150,
          size: '32'
        }),
        updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 })
      },
      finished_goods: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            {
              id: 501,
              cutting_id: 101,
              seth_id: 1,
              status: 'Ready',
              total_pieces: 150,
              finished_pieces: 150,
              stitching_pieces: 0
            }
          ])
        }),
        findOne: vi.fn().mockResolvedValue({
          id: 501,
          cutting_id: 101,
          seth_id: 1,
          status: 'Ready',
          total_pieces: 150,
          finished_pieces: 150
        }),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-fg' })
      },
      seth_hisabs: {
        find: vi.fn().mockImplementation(() => ({
          toArray: vi.fn().mockResolvedValue([]),
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([])
          })
        })),
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-hisab-id' }),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 })
      },
      seth_payments: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-pay' }),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 })
      }
    }

    mockDb = {
      collection: vi.fn((name: string) => {
        return mockCollections[name] || {
          find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]), sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) }),
          findOne: vi.fn().mockResolvedValue(null),
          insertOne: vi.fn().mockResolvedValue({}),
          updateOne: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({}),
          deleteOne: vi.fn().mockResolvedValue({})
        }
      })
    }

    vi.spyOn(mongoModule, 'getMongoDb').mockResolvedValue(mockDb as any)
    vi.spyOn(mongoModule, 'getNextSequence').mockResolvedValue(1)
  })

  describe('getWorkOverview()', () => {
    it('should_aggregate_rolls_cutting_and_stitching_readiness_for_seth', async () => {
      // Act
      const overview = await SethHisabService.getWorkOverview(1)

      // Assert
      expect(overview).toBeDefined()
      expect(overview.seths.length).toBe(1)
      expect(overview.rolls.length).toBe(1)
      expect(overview.lots.length).toBe(1)

      const lot = overview.lots[0]
      expect(lot.lot_number).toBe('LOT-901')
      expect(lot.roll_number).toBe('R-101')
      expect(lot.is_stitching_completed).toBe(true)
      expect(lot.is_settled).toBe(false)
      expect(overview.readyLots.length).toBe(1)
      expect(overview.inStitchingLots.length).toBe(0)
    })
  })

  describe('create()', () => {
    it('should_generate_hisab_and_link_cutting_and_sync_cashbook_when_advance_paid', async () => {
      // Arrange
      const input = {
        seth_id: 1,
        hisab_date: '2026-11-15',
        lots: [
          {
            cutting_id: 101,
            lot_number: 'LOT-901',
            cutting_date: '2026-11-10',
            roll_id: 10,
            roll_number: 'R-101',
            fabric_type: 'Heavy Indigo Denim',
            meter_used: 200,
            piece_count: 150,
            stitching_status: 'Ready',
            rate_per_piece: 50,
            amount: 7500
          }
        ],
        extra_charges: 500,
        extra_charges_notes: 'Washing',
        deductions: 200,
        deductions_notes: 'Defect piece',
        paid_amount: 3000,
        payment_method: 'Bank Transfer',
        handled_by: 'Akshaybhai',
        notes: 'November billing'
      }

      // Act
      const result = await SethHisabService.create(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.hisab_number).toMatch(/HSB-2026-0001/)
      expect(result.total_pieces).toBe(150)
      expect(result.stitching_amount).toBe(7500)
      expect(result.total_amount).toBe(7800) // 7500 + 500 - 200
      expect(result.paid_amount).toBe(3000)
      expect(result.balance_amount).toBe(4800)
      expect(result.payment_status).toBe('Partially Paid')

      // Verifies cutting entries were marked with hisab id
      expect(mockCollections.cutting_entries.updateMany).toHaveBeenCalledWith(
        { id: { $in: [101] } },
        expect.objectContaining({ $set: expect.objectContaining({ hisab_id: 1 }) })
      )

      // Verifies cashbook synced
      expect(CashBookService.logTransaction).toHaveBeenCalledWith(
        '2026-11-15',
        'Seth Payment',
        'Mahavir Seth',
        'Bank Transfer',
        3000,
        0,
        'Akshaybhai',
        'Seth Hisab',
        1,
        'November billing',
        undefined,
        expect.any(Object)
      )
    })
  })

  describe('updateStitchingStatus()', () => {
    it('should_update_finished_goods_status_and_pieces_when_stitching_completed', async () => {
      // Act
      const res = await SethHisabService.updateStitchingStatus(101, 'Ready')

      // Assert
      expect(res.success).toBe(true)
      expect(mockCollections.finished_goods.updateOne).toHaveBeenCalledWith(
        { cutting_id: 101 },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'Ready',
            finished_pieces: 150
          })
        })
      )
    })
  })

  describe('delete()', () => {
    it('should_unlink_cutting_lots_and_remove_hisab', async () => {
      // Arrange
      mockCollections.seth_hisabs.findOne.mockResolvedValueOnce({
        id: 1,
        hisab_number: 'HSB-2026-0001',
        linked_payment_id: 88
      })

      // Act
      const deleted = await SethHisabService.delete(1)

      // Assert
      expect(deleted).toBeDefined()
      expect(mockCollections.cutting_entries.updateMany).toHaveBeenCalledWith(
        { hisab_id: 1 },
        expect.objectContaining({ $unset: { hisab_id: '', hisab_number: '' } })
      )
      expect(mockCollections.seth_hisabs.deleteOne).toHaveBeenCalledWith({ id: 1 })
    })
  })
})
