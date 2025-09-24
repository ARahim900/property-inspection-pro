-- RUN THIS SQL IMMEDIATELY TO FIX THE STATUS ERROR
-- Go to: https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/sql/new
-- Paste this entire content and click "Run"

-- Fix the status CHECK constraint to match frontend values
ALTER TABLE inspection_items
DROP CONSTRAINT IF EXISTS inspection_items_status_check;

ALTER TABLE inspection_items
ADD CONSTRAINT inspection_items_status_check
CHECK (status IN ('Pass', 'Fail', 'N/A'));

-- Verify the fix
SELECT 'Status constraint fixed! You can now save inspections.' as message;