-- Create inspection areas table
create table if not exists public.inspection_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inspection_areas enable row level security;

-- Create policies for inspection areas
create policy "inspection_areas_select_own"
  on public.inspection_areas for select
  using (auth.uid() = user_id);

create policy "inspection_areas_insert_own"
  on public.inspection_areas for insert
  with check (auth.uid() = user_id);

create policy "inspection_areas_update_own"
  on public.inspection_areas for update
  using (auth.uid() = user_id);

create policy "inspection_areas_delete_own"
  on public.inspection_areas for delete
  using (auth.uid() = user_id);
