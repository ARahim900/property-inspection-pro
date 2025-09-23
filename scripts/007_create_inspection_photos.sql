-- Create inspection photos table
create table if not exists public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  item_id uuid not null references public.inspection_items(id) on delete cascade,
  name text not null,
  file_path text not null, -- Supabase Storage path
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inspection_photos enable row level security;

-- Create policies for inspection photos
create policy "inspection_photos_select_own"
  on public.inspection_photos for select
  using (auth.uid() = user_id);

create policy "inspection_photos_insert_own"
  on public.inspection_photos for insert
  with check (auth.uid() = user_id);

create policy "inspection_photos_update_own"
  on public.inspection_photos for update
  using (auth.uid() = user_id);

create policy "inspection_photos_delete_own"
  on public.inspection_photos for delete
  using (auth.uid() = user_id);
