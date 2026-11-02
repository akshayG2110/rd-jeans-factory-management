-- =============================================================================
-- Migration: 002_link_upad_to_salary.sql
-- Description: Link Upad advances to Salary settlements with N:1 physical FK,
--              status tracking (Pending -> Settled), deduction audits,
--              and automatic rollback trigger upon salary deletion.
-- =============================================================================

-- 1. Add settlement tracking columns to upad_records
ALTER TABLE upad_records
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS settled_in_salary_id INTEGER REFERENCES salaries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for upad status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_upad_status'
  ) THEN
    ALTER TABLE upad_records 
    ADD CONSTRAINT chk_upad_status CHECK (status IN ('Pending', 'Settled', 'Cancelled'));
  END IF;
END $$;

-- 2. Add deduction tracking columns to salaries
ALTER TABLE salaries
  ADD COLUMN IF NOT EXISTS total_upad_deducted NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS net_payable NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;

-- 3. Create high-performance indexes
CREATE INDEX IF NOT EXISTS idx_upad_status ON upad_records (status);
CREATE INDEX IF NOT EXISTS idx_upad_settled_salary ON upad_records (settled_in_salary_id);
CREATE INDEX IF NOT EXISTS idx_upad_emp_status ON upad_records (employee_id, status);

-- 4. Backfill existing salaries net_payable
UPDATE salaries 
SET net_payable = salary_amount - total_upad_deducted 
WHERE net_payable = 0.00 AND salary_amount > 0;

-- 5. Trigger to automatically revert linked upad records when a salary settlement is deleted
CREATE OR REPLACE FUNCTION trg_salary_revert_upads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE upad_records
  SET status = 'Pending', settled_in_salary_id = NULL, settled_at = NULL, updated_at = NOW()
  WHERE settled_in_salary_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_salary_after_delete_upads ON salaries;

CREATE TRIGGER trg_salary_after_delete_upads
AFTER DELETE ON salaries
FOR EACH ROW
EXECUTE FUNCTION trg_salary_revert_upads();
