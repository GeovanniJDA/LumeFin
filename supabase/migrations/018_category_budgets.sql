create table category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references bill_categories(id) on delete cascade,
  reference_month text not null check (reference_month ~ '^\d{4}-\d{2}$'),
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, reference_month)
);

create index category_budgets_user_month_idx on category_budgets (user_id, reference_month);

alter table category_budgets enable row level security;

create policy "owner" on category_budgets
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from bill_categories
      where bill_categories.id = category_budgets.category_id
        and (bill_categories.user_id is null or bill_categories.user_id = auth.uid())
    )
  );
