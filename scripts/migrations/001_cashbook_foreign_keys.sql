-- =============================================================================
-- Migration: 001_cashbook_foreign_keys.sql
-- Description: Add physical Foreign Key constraints, Exclusive Arc constraint,
--              high-performance indexes, and atomic cascade balance recalculation
--              trigger to cash_book_ledger.
-- =============================================================================

-- 1. Add physical foreign key columns
ALTER TABLE cash_book_ledger 
  ADD COLUMN IF NOT EXISTS upad_id INTEGER REFERENCES upad_records(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS salary_id INTEGER REFERENCES salaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS seth_payment_id INTEGER REFERENCES seth_payments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS income_id INTEGER REFERENCES incomes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE;

-- 2. Create single-column indexes for ultra-fast joins and cascade lookups
CREATE INDEX IF NOT EXISTS idx_cashbook_upad_id ON cash_book_ledger (upad_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_salary_id ON cash_book_ledger (salary_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_seth_payment_id ON cash_book_ledger (seth_payment_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_income_id ON cash_book_ledger (income_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_expense_id ON cash_book_ledger (expense_id);

-- 3. Backfill physical foreign keys from existing reference_module & reference_id
UPDATE cash_book_ledger 
SET upad_id = reference_id 
WHERE (reference_module ILIKE 'Upad' OR transaction_type ILIKE 'Upad')
  AND upad_id IS NULL 
  AND EXISTS (SELECT 1 FROM upad_records WHERE id = cash_book_ledger.reference_id);

UPDATE cash_book_ledger 
SET salary_id = reference_id 
WHERE (reference_module ILIKE 'Salary' OR transaction_type ILIKE 'Salary')
  AND salary_id IS NULL 
  AND EXISTS (SELECT 1 FROM salaries WHERE id = cash_book_ledger.reference_id);

UPDATE cash_book_ledger 
SET seth_payment_id = reference_id 
WHERE (reference_module ILIKE 'Seth Payment' OR transaction_type ILIKE 'Seth Payment')
  AND seth_payment_id IS NULL 
  AND EXISTS (SELECT 1 FROM seth_payments WHERE id = cash_book_ledger.reference_id);

UPDATE cash_book_ledger 
SET income_id = reference_id 
WHERE (reference_module ILIKE 'Income' OR transaction_type ILIKE 'Income')
  AND income_id IS NULL 
  AND EXISTS (SELECT 1 FROM incomes WHERE id = cash_book_ledger.reference_id);

UPDATE cash_book_ledger 
SET expense_id = reference_id 
WHERE (reference_module ILIKE 'Expense' OR reference_module ILIKE 'Expenses')
  AND expense_id IS NULL 
  AND EXISTS (SELECT 1 FROM expenses WHERE id = cash_book_ledger.reference_id);

-- 4. Add Exclusive Arc Check Constraint
-- Ensures each cashbook record points to at most ONE source transaction (or 0 for Manual entries)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_cash_book_exclusive_ref'
  ) THEN
    ALTER TABLE cash_book_ledger 
    ADD CONSTRAINT chk_cash_book_exclusive_ref CHECK (
      (
        (CASE WHEN upad_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN salary_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN seth_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN income_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END)
      ) <= 1
    );
  END IF;
END $$;

-- 5. Trigger to automatically recalculate running balances upon deletion or cascade deletion
CREATE OR REPLACE FUNCTION trg_cash_book_recalculate_stmt()
RETURNS TRIGGER AS $$
DECLARE
  min_id INT;
BEGIN
  SELECT MIN(id) INTO min_id FROM deleted_rows;
  IF min_id IS NOT NULL THEN
    WITH updated_balances AS (
      SELECT 
        id,
        SUM(income_amount - out_amount) OVER (ORDER BY id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS new_balance
      FROM cash_book_ledger
    )
    UPDATE cash_book_ledger c
    SET running_balance = u.new_balance, updated_at = NOW()
    FROM updated_balances u
    WHERE c.id = u.id AND c.id >= min_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cash_book_after_delete ON cash_book_ledger;

CREATE TRIGGER trg_cash_book_after_delete
AFTER DELETE ON cash_book_ledger
REFERENCING OLD TABLE AS deleted_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_cash_book_recalculate_stmt();
