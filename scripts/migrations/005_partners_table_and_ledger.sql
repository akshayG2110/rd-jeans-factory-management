-- =============================================================================
-- Migration: 005_partners_table_and_ledger.sql
-- Description: Create dedicated partners and partner_transactions tables,
--              link cash_book_ledger to partners via physical FK,
--              seed initial partners (Rajubhai & Dhruveshbhai), and backfill
--              historical cash desk records.
-- =============================================================================

-- 1. Create Partners Table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    mobile_number VARCHAR(30),
    profit_share_percentage NUMERIC(5, 2) DEFAULT 50.00 NOT NULL CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100),
    opening_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    current_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Seed Default Partners (Rajubhai & Dhruveshbhai)
INSERT INTO partners (name, profit_share_percentage, opening_balance, current_balance, status, notes)
VALUES 
    ('Rajubhai', 50.00, 100000.00, 100000.00, 'Active', 'Co-Founder & Managing Partner'),
    ('Dhruveshbhai', 50.00, 100000.00, 100000.00, 'Active', 'Co-Founder & Financial Partner')
ON CONFLICT (name) DO UPDATE 
SET updated_at = CURRENT_TIMESTAMP;

-- 3. Create Partner Transactions (Capital Equity, Drawings & Cash Transfers)
CREATE TABLE IF NOT EXISTS partner_transactions (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Capital Investment', 'Drawing (Personal Withdrawal)', 'Profit Share', 'Cash Transfer', 'Adjustment')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) DEFAULT 'Cash' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Add Physical Foreign Key partner_id to cash_book_ledger
ALTER TABLE cash_book_ledger
    ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;

-- 5. Backfill existing cash_book_ledger entries by matching handled_by with partners
UPDATE cash_book_ledger c
SET partner_id = p.id
FROM partners p
WHERE c.partner_id IS NULL 
  AND (
    LOWER(c.handled_by) = LOWER(p.name)
    OR (LOWER(p.name) = 'rajubhai' AND LOWER(c.handled_by) LIKE '%raju%')
    OR (LOWER(p.name) = 'dhruveshbhai' AND LOWER(c.handled_by) LIKE '%dhruvesh%')
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners (name);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_partner ON partner_transactions (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_date ON partner_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_book_partner ON cash_book_ledger (partner_id);
