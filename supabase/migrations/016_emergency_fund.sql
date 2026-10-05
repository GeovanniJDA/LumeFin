create table emergency_fund_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null default 'Reserva de Emergência' check (length(trim(name)) > 0),
  target_amount numeric(10,2) not null check (target_amount > 0),
  target_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emergency_fund_goals_user_idx on emergency_fund_goals (user_id);

alter table emergency_fund_goals enable row level security;
create policy "owner" on emergency_fund_goals
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table emergency_fund_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references emergency_fund_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  type text not null default 'deposit' check (type in ('deposit', 'withdrawal')),
  contribution_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index emergency_fund_contributions_user_date_idx on emergency_fund_contributions (user_id, contribution_date desc);
create index emergency_fund_contributions_goal_idx on emergency_fund_contributions (goal_id);

alter table emergency_fund_contributions enable row level security;
create policy "owner" on emergency_fund_contributions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
