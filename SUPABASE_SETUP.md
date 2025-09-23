# Supabase Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the Project URL and anon/public key
4. Replace the placeholder values in your `.env.local` file

## Database Setup

Run the SQL scripts in the `scripts/` directory in your Supabase SQL editor to create the necessary tables:

1. `001_create_profiles.sql`
2. `002_create_clients.sql`
3. `003_create_properties.sql`
4. `004_create_inspections.sql`
5. `005_create_inspection_areas.sql`
6. `006_create_inspection_items.sql`
7. `007_create_inspection_photos.sql`
8. `008_create_invoices.sql`
9. `009_create_invoice_services.sql`
10. `010_create_storage_buckets.sql`

## Storage Bucket Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `inspection-photos`
3. Set the bucket to public if you want direct access to images
4. Configure RLS policies as needed

## Authentication Setup

The application uses Supabase Auth. You can configure authentication providers in your Supabase dashboard under Authentication > Providers.
