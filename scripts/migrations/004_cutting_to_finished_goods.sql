-- =============================================================================
-- Migration: 004_cutting_to_finished_goods.sql
-- Description: Physically link Cutting Lots to Finished Goods / Garment Inventory
--              with a 1:N FK relationship. Enables tracking piece lifecycle from
--              fabric cut -> stitching -> washing -> ready -> dispatched.
-- =============================================================================

-- 1. Create Finished Goods Inventory Table
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

-- 2. Create high-performance indexes
CREATE INDEX IF NOT EXISTS idx_finished_goods_cutting ON finished_goods (cutting_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_seth ON finished_goods (seth_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_lot ON finished_goods (lot_number);
CREATE INDEX IF NOT EXISTS idx_finished_goods_status ON finished_goods (status);

-- 3. Backfill existing cutting entries with an initial inventory batch
INSERT INTO finished_goods (cutting_id, seth_id, lot_number, item_name, size, total_pieces, finished_pieces, status, created_at, updated_at)
SELECT c.id, r.seth_id, c.lot_number, 'Denim Jeans', c.size, c.piece_count, c.piece_count, 'Cut', c.created_at, c.updated_at
FROM cutting_entries c
LEFT JOIN rolls r ON c.roll_id = r.id
WHERE NOT EXISTS (
    SELECT 1 FROM finished_goods fg WHERE fg.cutting_id = c.id
);
