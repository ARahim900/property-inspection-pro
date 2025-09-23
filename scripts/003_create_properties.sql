-- Create properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  location text not null,
  type text not null check (type in ('Commercial', 'Residential')),
  size numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.properties enable row level security;

-- Create policies for properties
create policy "properties_select_own"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "properties_insert_own"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "properties_update_own"
  on public.properties for update
  using (auth.uid() = user_id);

create policy "properties_delete_own"
  on public.properties for delete
  using (auth.uid() = user_id);
