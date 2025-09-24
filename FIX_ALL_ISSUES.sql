-- COMPREHENSIVE FIX FOR ALL INSPECTION ISSUES
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/sql/new

-- 1. First, check existing constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'inspection_items'::regclass;

-- 2. Drop any existing status constraints (handle typo in constraint name)
ALTER TABLE inspection_items
DROP CONSTRAINT IF EXISTS inspection_items_status_check;

ALTER TABLE inspection_items
DROP CONSTRAINT IF EXISTS "inspection_items_status_chec";

-- 3. Add the correct constraint
ALTER TABLE inspection_items
ADD CONSTRAINT inspection_items_status_check
CHECK (status IN ('Pass', 'Fail', 'N/A'));

-- 4. Create or replace the storage bucket policy to allow uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-photos',
  'inspection-photos',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- 5. Create RLS policies for storage bucket (if not exists)
CREATE POLICY "Users can upload their own inspection photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inspection-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own inspection photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'inspection-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own inspection photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'inspection-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own inspection photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'inspection-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Verify the fix
SELECT
  'All fixes applied successfully!' as message,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'inspection_items'::regclass
AND conname LIKE '%status%';