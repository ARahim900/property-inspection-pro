# Database Setup Instructions

## Quick Setup

Follow these steps to set up your database tables in Supabase:

### Step 1: Run the SQL Migrations

**IMPORTANT: Run these migrations in order!**

1. Open your Supabase SQL Editor:
   https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/sql/new

2. **First Migration** - Basic tables:
   - Copy the entire contents of `supabase/migrations/001_create_tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Second Migration** - Additional tables:
   - Clear the SQL Editor
   - Copy the entire contents of `supabase/migrations/002_additional_tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

This will create all the necessary tables:
- `inspections` - Main inspection reports
- `inspection_areas` - Areas within each inspection
- `inspection_items` - Individual inspection items
- `inspection_photos` - Photos attached to items
- `clients` - Client information
- `invoices` - Invoice records
- `invoice_items` - Line items in invoices

### Step 2: Create Storage Bucket for Photos

1. Go to Storage in your Supabase dashboard:
   https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/storage/buckets

2. Click "New bucket"

3. Name it: `inspection-photos`

4. Set the following:
   - Public bucket: OFF (keep it private)
   - File size limit: 10MB
   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp

5. Click "Create bucket"

### Step 3: Get Your Service Role Key (Optional - for advanced features)

If you want to run automated setup scripts:

1. Go to Settings → API in your Supabase dashboard:
   https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/settings/api

2. Copy the `service_role` key (keep this secret!)

3. Add it to your `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 4: Verify Everything Works

1. Restart your development server:
   ```bash
   npm run dev -- -p 3002
   ```

2. Go to http://localhost:3002

3. Sign up or login

4. Try creating a new inspection report

## Troubleshooting

### "Failed to save inspection" Error

This usually means the tables haven't been created yet. Make sure you:
1. Ran the SQL migration successfully
2. Didn't get any errors in the SQL Editor
3. Are logged in with a valid user account

### Photos Not Uploading

Make sure:
1. The `inspection-photos` storage bucket exists
2. The bucket is set to private (not public)
3. You're not exceeding the 10MB file size limit

### Permission Denied Errors

The tables use Row Level Security (RLS). Make sure:
1. You're logged in
2. The RLS policies were created (they're included in the migration)
3. You're trying to access only your own data

## What Each Table Does

- **inspections**: Stores the main inspection report details (client, property, date, etc.)
- **inspection_areas**: Different areas of the property being inspected (e.g., "Kitchen", "Bathroom")
- **inspection_items**: Individual items checked in each area with their status and comments
- **inspection_photos**: Photos attached to inspection items (stored as base64 or URLs)
- **clients**: Customer/client information for inspections and invoices
- **invoices**: Billing records linked to inspections
- **invoice_items**: Line items on each invoice

## Security

All tables have Row Level Security (RLS) enabled, which means:
- Users can only see and modify their own data
- Each record is tied to a user ID
- The database automatically filters data based on who's logged in

This ensures complete data isolation between different users of the system.