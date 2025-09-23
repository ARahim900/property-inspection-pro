-- Create invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  client_name text not null,
  client_address text not null,
  client_email text not null,
  property_location text not null,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  status text not null check (status in ('Paid', 'Unpaid', 'Partial', 'Draft')),
  notes text,
  template text check (template in ('classic', 'modern', 'compact')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invoices enable row level security;

-- Create policies for invoices
create policy "invoices_select_own"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "invoices_insert_own"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "invoices_update_own"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "invoices_delete_own"
  on public.invoices for delete
  using (auth.uid() = user_id);
