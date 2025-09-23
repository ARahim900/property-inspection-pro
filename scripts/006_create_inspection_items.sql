-- Create inspection items table
create table if not exists public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  area_id uuid not null references public.inspection_areas(id) on delete cascade,
  category text not null,
  point text not null,
  status text not null check (status in ('Pass', 'Fail', 'N/A')),
  comments text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inspection_items enable row level security;

-- Create policies for inspection items
create policy "inspection_items_select_own"
  on public.inspection_items for select
  using (auth.uid() = user_id);

create policy "inspection_items_insert_own"
  on public.inspection_items for insert
  with check (auth.uid() = user_id);

create policy "inspection_items_update_own"
  on public.inspection_items for update
  using (auth.uid() = user_id);

create policy "inspection_items_delete_own"
  on public.inspection_items for delete
  using (auth.uid() = user_id);
