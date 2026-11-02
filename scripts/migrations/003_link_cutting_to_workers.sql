-- =============================================================================
-- Migration: 003_link_cutting_to_workers.sql
-- Description: Physically link Cutting Lots to Workers (employees) with N:1 FK,
--              enabling tracking of which master/worker cut each lot, worker
--              productivity auditing, and piece-rate wage calculation.
-- =============================================================================

-- 1. Add employee_id Foreign Key to cutting_entries
ALTER TABLE cutting_entries
  ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_cutting_employee ON cutting_entries (employee_id);
CREATE INDEX IF NOT EXISTS idx_cutting_emp_date ON cutting_entries (employee_id, cutting_date DESC);
