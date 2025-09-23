-- Create invoice services table
create table if not exists public.invoice_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invoice_services enable row level security;

-- Create policies for invoice services
create policy "invoice_services_select_own"
  on public.invoice_services for select
  using (auth.uid() = user_id);

create policy "invoice_services_insert_own"
  on public.invoice_services for insert
  with check (auth.uid() = user_id);

create policy "invoice_services_update_own"
  on public.invoice_services for update
  using (auth.uid() = user_id);

create policy "invoice_services_delete_own"
  on public.invoice_services for delete
  using (auth.uid() = user_id);
