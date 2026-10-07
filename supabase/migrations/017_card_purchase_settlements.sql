-- Quitação por compra/mês: marca uma ocorrência da fatura (uma compra em um
-- mês) como paga ou antecipada, para excluí-la do valor pendente da fatura.
create table card_purchase_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_purchase_id uuid not null references card_purchases(id) on delete cascade,
  reference_month text not null,
  created_at timestamptz not null default now(),
  unique (card_purchase_id, reference_month)
);

create index card_purchase_settlements_user_idx on card_purchase_settlements (user_id);
create index card_purchase_settlements_purchase_idx on card_purchase_settlements (card_purchase_id);

alter table card_purchase_settlements enable row level security;

create policy "owner" on card_purchase_settlements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
