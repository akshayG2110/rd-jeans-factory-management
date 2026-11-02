import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeService } from '@/lib/services/employees'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('EmployeeService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll()', () => {
    it('should_filter_employees_when_name_role_and_status_criteria_provided', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 1, employee_name: 'Babubhai', role: 'Cutting Worker', status: 'Active' }]
      } as any)

      // Act
      const workers = await EmployeeService.getAll('Babu', 'Cutting Worker', 'Active')

      // Assert
      expect(workers.length).toBe(1)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        ['%Babu%', 'Cutting Worker', 'Active']
      )
    })
  })

  describe('create()', () => {
    it('should_default_status_to_active_when_status_not_explicitly_specified', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 2, employee_name: 'Shankar', role: 'Helper', status: 'Active' }]
      } as any)

      // Act
      const res = await EmployeeService.create({
        employee_name: 'Shankar',
        role: 'Helper',
        joining_date: '2026-05-01'
      })

      // Assert
      expect(res.id).toBe(2)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employees'),
        ['Shankar', 'Helper', '2026-05-01', 'Active']
      )
    })
  })

  describe('update()', () => {
    it('should_preserve_unmodified_fields_when_partial_update_requested', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [{ id: 3, employee_name: 'Old Name', role: 'Stitching Worker', status: 'Active' }]
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 3, employee_name: 'New Name', role: 'Stitching Worker', status: 'Active' }]
        } as any)

      // Act
      const updated = await EmployeeService.update(3, { employee_name: 'New Name' })

      // Assert
      expect(updated.employee_name).toBe('New Name')
    })
  })

  describe('delete()', () => {
    it('should_throw_error_and_block_deletion_when_worker_has_unsettled_upad_advances', async () => {
      // Arrange
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ count: '2' }]
      } as any)

      // Act & Assert
      await expect(EmployeeService.delete(5)).rejects.toThrow(
        'Cannot delete worker with outstanding (unsettled) Upad advances'
      )
    })

    it('should_soft_delete_to_inactive_when_worker_has_cutting_or_salary_history', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 6, status: 'Inactive' }] } as any)

      // Act
      const res = await EmployeeService.delete(6)

      // Assert
      expect(res.status).toBe('Inactive')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE employees SET status = 'Inactive'"),
        [6]
      )
    })

    it('should_hard_delete_record_when_no_upads_cutting_or_salary_history_exists', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 7, employee_name: 'Clean Worker' }] } as any)

      // Act
      const deleted = await EmployeeService.delete(7)

      // Assert
      expect(deleted.id).toBe(7)
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM employees WHERE id = $1 RETURNING *',
        [7]
      )
    })
  })
})
