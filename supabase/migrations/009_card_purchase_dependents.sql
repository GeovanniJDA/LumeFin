create table card_purchase_dependents (
  card_purchase_id uuid not null references card_purchases(id) on delete cascade,
  dependent_id uuid not null references dependents(id) on delete cascade,
  primary key (card_purchase_id, dependent_id)
);

create index card_purchase_dependents_dependent_id_idx on card_purchase_dependents(dependent_id);

alter table card_purchase_dependents enable row level security;

create policy "owner" on card_purchase_dependents
  for all
  using (
    exists (
      select 1 from card_purchases
      where card_purchases.id = card_purchase_dependents.card_purchase_id
        and card_purchases.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from card_purchases
      where card_purchases.id = card_purchase_dependents.card_purchase_id
        and card_purchases.user_id = auth.uid()
    )
    and exists (
      select 1 from dependents
      where dependents.id = card_purchase_dependents.dependent_id
        and dependents.user_id = auth.uid()
    )
  );
