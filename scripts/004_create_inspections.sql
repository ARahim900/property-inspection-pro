-- Create inspections table
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  property_location text not null,
  property_type text not null check (property_type in ('Apartment', 'Villa', 'Building', 'Other')),
  inspector_name text not null,
  inspection_date date not null,
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inspections enable row level security;

-- Create policies for inspections
create policy "inspections_select_own"
  on public.inspections for select
  using (auth.uid() = user_id);

create policy "inspections_insert_own"
  on public.inspections for insert
  with check (auth.uid() = user_id);

create policy "inspections_update_own"
  on public.inspections for update
  using (auth.uid() = user_id);

create policy "inspections_delete_own"
  on public.inspections for delete
  using (auth.uid() = user_id);
