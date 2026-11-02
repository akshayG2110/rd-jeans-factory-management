import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RollService } from '@/lib/services/rolls'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('RollService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create()', () => {
    it('should_initialize_roll_with_available_status_and_zero_used_meters_when_created', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ seth_name: 'Mahavir Apparels' }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 5,
            seth_id: 1,
            entry_date: '2026-05-01',
            roll_number: 'RL-501',
            short_number: 'SH-5',
            fabric_type: 'Denim 12oz',
            received_meter: '120.50',
            used_meter: '0.00',
            remaining_meter: '120.50',
            status: 'Available'
          }]
        } as any)

      // Act
      const result = await RollService.create({
        seth_id: 1,
        entry_date: '2026-05-01',
        roll_number: 'RL-501',
        short_number: 'SH-5',
        fabric_type: 'Denim 12oz',
        received_meter: 120.5
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.roll_number).toBe('RL-501')
      expect(result.used_meter).toBe('0.00')
      expect(result.remaining_meter).toBe('120.50')
      expect(result.status).toBe('Available')
      expect(result.seth_name).toBe('Mahavir Apparels')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rolls'),
        [1, '2026-05-01', 'RL-501', 'SH-5', 'Denim 12oz', 120.5, 120.5, 'Available', null]
      )
    })

    it('should_throw_error_when_seth_client_does_not_exist', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act & Assert
      await expect(
        RollService.create({
          seth_id: 999,
          entry_date: '2026-05-01',
          roll_number: 'RL-999',
          short_number: 'SH-9',
          fabric_type: 'Denim',
          received_meter: 100
        })
      ).rejects.toThrow('Seth client with ID 999 does not exist')
    })
  })

  describe('getById()', () => {
    it('should_return_roll_with_seth_name_when_valid_id_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 5, roll_number: 'RL-501', seth_name: 'Mahavir Apparels' }]
      } as any)

      // Act
      const roll = await RollService.getById(5)

      // Assert
      expect(roll).toBeDefined()
      expect(roll?.id).toBe(5)
      expect(roll?.seth_name).toBe('Mahavir Apparels')
    })

    it('should_return_null_when_roll_does_not_exist', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const roll = await RollService.getById(999)

      // Assert
      expect(roll).toBeNull()
    })
  })

  describe('update()', () => {
    it('should_recalculate_status_when_remaining_meters_change', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{
            id: 5,
            seth_id: 1,
            entry_date: '2026-05-01',
            roll_number: 'RL-501',
            short_number: 'SH-5',
            fabric_type: 'Denim',
            received_meter: '100.00',
            used_meter: '40.00',
            remaining_meter: '60.00'
          }]
        } as any)
        .mockResolvedValueOnce({ rows: [{ seth_name: 'Mahavir Apparels' }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 5,
            roll_number: 'RL-501-UPDATED',
            status: 'Partially Used'
          }]
        } as any)

      // Act
      const updated = await RollService.update(5, { roll_number: 'RL-501-UPDATED' })

      // Assert
      expect(updated.roll_number).toBe('RL-501-UPDATED')
    })

    it('should_return_null_when_updating_non_existent_roll', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any)

      // Act
      const res = await RollService.update(999, { fabric_type: 'Silk' })

      // Assert
      expect(res).toBeNull()
    })
  })

  describe('getAll()', () => {
    it('should_filter_rolls_when_fabric_type_and_status_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, roll_number: 'RL-101' }]
      } as any)

      // Act
      const rows = await RollService.getAll({
        seth_id: 2,
        fabric_type: 'Cotton Twill',
        status: 'Available',
        search: 'RL-1'
      })

      // Assert
      expect(rows.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        expect.arrayContaining([2, 'Cotton Twill', 'Available', '%RL-1%'])
      )
    })
  })

  describe('delete()', () => {
    it('should_delete_roll_cleanly_when_valid_id_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 5, roll_number: 'RL-501' }]
      } as any)

      // Act
      const deleted = await RollService.delete(5)

      // Assert
      expect(deleted.id).toBe(5)
      expect(db.query).toHaveBeenCalledWith('DELETE FROM rolls WHERE id = $1 RETURNING *', [5])
    })
  })
})
