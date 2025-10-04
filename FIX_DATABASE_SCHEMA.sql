-- Fix database schema issues
-- This script addresses:
-- 1. Missing user_id column in clients table (error: column clients.user_id does not exist)
-- 2. Foreign key relationship error between inspections and inspection_areas

-- Note: The clients table already has user_id defined in the schema (002_create_clients.sql)
-- If it's missing, it means the table was created without running the migration properly.

-- Step 1: Check if user_id exists in clients table, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clients'
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to clients table
        ALTER TABLE public.clients
        ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

        RAISE NOTICE 'Added user_id column to clients table';
    ELSE
        RAISE NOTICE 'user_id column already exists in clients table';
    END IF;
END $$;

-- Step 2: The inspection_areas foreign key relationship should already exist
-- The error message suggests PostgREST is looking for a relationship that exists
-- This is likely a schema cache issue in Supabase

-- To fix this, we need to ensure the foreign key constraint exists and is named properly
-- First, drop any existing foreign key constraints on inspection_id in inspection_areas
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.inspection_areas'::regclass
        AND contype = 'f'
        AND confrelid = 'public.inspections'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.inspection_areas DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Now add the foreign key constraint with a clear name
ALTER TABLE public.inspection_areas
ADD CONSTRAINT inspection_areas_inspection_id_fkey
FOREIGN KEY (inspection_id)
REFERENCES public.inspections(id)
ON DELETE CASCADE;

-- Step 3: Verify and display the table structures
DO $$
BEGIN
    RAISE NOTICE 'Schema verification complete. Please reload the schema cache in Supabase.';
    RAISE NOTICE 'To reload schema cache: Go to Supabase Dashboard > Settings > API > Click "Reload Schema"';
END $$;

-- Step 4: List all foreign key relationships for verification
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('clients', 'inspections', 'inspection_areas', 'inspection_items', 'inspection_photos')
ORDER BY tc.table_name;
