create table cash_flow_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  description text not null check (length(trim(description)) > 0),
  amount numeric(10,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create index cash_flow_entries_user_date_idx on cash_flow_entries (user_id, entry_date);

alter table cash_flow_entries enable row level security;
create policy "owner" on cash_flow_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
