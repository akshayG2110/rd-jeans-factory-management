-- =============================================================================
-- RD Jeans Factory Management System - Complete Production Supabase Setup
-- Paste and Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Default Admin User (rdjeans123 / RD@123)
INSERT INTO users (username, password_hash)
VALUES ('rdjeans123', '$2b$10$wILqCdL9YSDbkRtMO4r0F.o2Xq82t0WbTXjtqXhsTBtCrZhQuGau.')
ON CONFLICT (username) DO NOTHING;

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(150) NOT NULL,
    role VARCHAR(80) NOT NULL,
    joining_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (employee_name);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);

-- 3. Seths Table (Clients / Cloth Job-Workers)
CREATE TABLE IF NOT EXISTS seths (
    id SERIAL PRIMARY KEY,
    seth_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(30),
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seths_name ON seths (seth_name);

-- 4. Partners Table
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

-- Seed Default Partners
INSERT INTO partners (name, profit_share_percentage, opening_balance, current_balance, status, notes)
VALUES 
    ('Rajubhai', 50.00, 0.00, 0.00, 'Active', 'Co-Founder & Managing Partner'),
    ('Dhruveshbhai', 50.00, 0.00, 0.00, 'Active', 'Co-Founder & Financial Partner')
ON CONFLICT (name) DO NOTHING;

-- 5. Salaries Table
CREATE TABLE IF NOT EXISTS salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
    salary_year INTEGER NOT NULL CHECK (salary_year >= 2020),
    salary_amount NUMERIC(10, 2) NOT NULL,
    total_upad_deducted NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_salaries_emp_month ON salaries (employee_id, salary_year, salary_month);

-- 6. Upad Records Table (Salary Advances)
CREATE TABLE IF NOT EXISTS upad_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Settled', 'Cancelled')),
    settled_in_salary_id INTEGER REFERENCES salaries(id) ON DELETE SET NULL,
    settled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_upad_employee ON upad_records (employee_id);
CREATE INDEX IF NOT EXISTS idx_upad_date ON upad_records (date);
CREATE INDEX IF NOT EXISTS idx_upad_status ON upad_records (status);
CREATE INDEX IF NOT EXISTS idx_upad_settled_salary ON upad_records (settled_in_salary_id);

-- 7. Seth Payments Table
CREATE TABLE IF NOT EXISTS seth_payments (
    id SERIAL PRIMARY KEY,
    seth_id INTEGER NOT NULL REFERENCES seths(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seth_payments_seth ON seth_payments (seth_id);

-- 8. Rolls Table (Denim Inventory)
CREATE TABLE IF NOT EXISTS rolls (
    id SERIAL PRIMARY KEY,
    seth_id INTEGER NOT NULL REFERENCES seths(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    roll_number VARCHAR(80) UNIQUE NOT NULL,
    short_number VARCHAR(80) UNIQUE NOT NULL,
    fabric_type VARCHAR(100) NOT NULL,
    received_meter NUMERIC(10, 2) NOT NULL CHECK (received_meter > 0),
    used_meter NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    remaining_meter NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Available' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rolls_seth ON rolls (seth_id);
CREATE INDEX IF NOT EXISTS idx_rolls_status ON rolls (status);

-- 9. Cutting Entries Table
CREATE TABLE IF NOT EXISTS cutting_entries (
    id SERIAL PRIMARY KEY,
    cutting_date DATE NOT NULL,
    lot_number VARCHAR(80) UNIQUE NOT NULL,
    roll_id INTEGER NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    meter_used NUMERIC(10, 2) NOT NULL CHECK (meter_used > 0),
    layer_information VARCHAR(100),
    piece_count INTEGER NOT NULL CHECK (piece_count > 0),
    size VARCHAR(40) NOT NULL,
    pana NUMERIC(10, 2),
    average NUMERIC(10, 2),
    sort_number VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cutting_roll ON cutting_entries (roll_id);
CREATE INDEX IF NOT EXISTS idx_cutting_date ON cutting_entries (cutting_date);
CREATE INDEX IF NOT EXISTS idx_cutting_employee ON cutting_entries (employee_id);

-- 10. Finished Goods Table
CREATE TABLE IF NOT EXISTS finished_goods (
    id SERIAL PRIMARY KEY,
    cutting_id INTEGER NOT NULL REFERENCES cutting_entries(id) ON DELETE CASCADE,
    seth_id INTEGER REFERENCES seths(id) ON DELETE SET NULL,
    lot_number VARCHAR(80) NOT NULL,
    item_name VARCHAR(150) NOT NULL DEFAULT 'Denim Jeans',
    size VARCHAR(40) NOT NULL,
    color_shade VARCHAR(80) DEFAULT 'Standard Indigo',
    total_pieces INTEGER NOT NULL CHECK (total_pieces >= 0),
    stitching_pieces INTEGER DEFAULT 0 NOT NULL CHECK (stitching_pieces >= 0),
    finished_pieces INTEGER DEFAULT 0 NOT NULL CHECK (finished_pieces >= 0),
    rejected_pieces INTEGER DEFAULT 0 NOT NULL CHECK (rejected_pieces >= 0),
    dispatched_pieces INTEGER DEFAULT 0 NOT NULL CHECK (dispatched_pieces >= 0),
    status VARCHAR(40) DEFAULT 'Cut' NOT NULL CHECK (status IN ('Cut', 'In Stitching', 'Washing', 'Ready', 'Dispatched', 'Closed')),
    unit_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    dispatch_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finished_goods_cutting ON finished_goods (cutting_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_seth ON finished_goods (seth_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_lot ON finished_goods (lot_number);
CREATE INDEX IF NOT EXISTS idx_finished_goods_status ON finished_goods (status);

-- 11. Incomes Table
CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    income_date DATE NOT NULL,
    income_source VARCHAR(100) NOT NULL,
    source_name VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_date DATE NOT NULL,
    expense_category VARCHAR(100) NOT NULL,
    party_name VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (expense_category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);

-- 13. Cash Book Ledger Table
CREATE TABLE IF NOT EXISTS cash_book_ledger (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    income_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    out_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    running_balance NUMERIC(10, 2) NOT NULL,
    handled_by VARCHAR(80) NOT NULL,
    reference_module VARCHAR(80) NOT NULL,
    reference_id INTEGER NOT NULL,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    upad_id INTEGER REFERENCES upad_records(id) ON DELETE CASCADE,
    salary_id INTEGER REFERENCES salaries(id) ON DELETE CASCADE,
    seth_payment_id INTEGER REFERENCES seth_payments(id) ON DELETE CASCADE,
    income_id INTEGER REFERENCES incomes(id) ON DELETE CASCADE,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_cash_book_exclusive_ref CHECK (
      (
        (CASE WHEN upad_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN salary_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN seth_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN income_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END)
      ) <= 1
    )
);
CREATE INDEX IF NOT EXISTS idx_cashbook_date ON cash_book_ledger (transaction_date);
CREATE INDEX IF NOT EXISTS idx_cashbook_handled ON cash_book_ledger (handled_by);
CREATE INDEX IF NOT EXISTS idx_cashbook_ref ON cash_book_ledger (reference_module, reference_id);

-- 14. Partner Transactions Table
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

-- 15. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    action_type VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Factory Balance Table
CREATE TABLE IF NOT EXISTS factory_balance (
    id SERIAL PRIMARY KEY,
    current_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial factory balance
INSERT INTO factory_balance (id, current_balance)
VALUES (1, 0.00)
ON CONFLICT (id) DO NOTHING;
