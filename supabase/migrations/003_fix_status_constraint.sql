-- Fix the status CHECK constraint to match frontend values
-- The frontend uses 'Pass', 'Fail', 'N/A' but the database expects different values

-- First, drop the existing constraint
ALTER TABLE inspection_items
DROP CONSTRAINT IF EXISTS inspection_items_status_check;

-- Add the new constraint with correct values
ALTER TABLE inspection_items
ADD CONSTRAINT inspection_items_status_check
CHECK (status IN ('Pass', 'Fail', 'N/A'));