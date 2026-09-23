create table credit_card_dependents (
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  dependent_id uuid not null references dependents(id) on delete cascade,
  primary key (credit_card_id, dependent_id)
);

insert into credit_card_dependents (credit_card_id, dependent_id)
select id, dependent_id from credit_cards where dependent_id is not null;

create index credit_card_dependents_dependent_id_idx on credit_card_dependents(dependent_id);

drop policy "owner" on credit_cards;
create policy "owner" on credit_cards
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      dependent_id is null
      or exists (
        select 1 from dependents
        where dependents.id = credit_cards.dependent_id
          and dependents.user_id = auth.uid()
      )
    )
  );

alter table credit_card_dependents enable row level security;

create policy "owner" on credit_card_dependents
  for all
  using (
    exists (
      select 1 from credit_cards
      where credit_cards.id = credit_card_dependents.credit_card_id
        and credit_cards.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from credit_cards
      where credit_cards.id = credit_card_dependents.credit_card_id
        and credit_cards.user_id = auth.uid()
    )
    and exists (
      select 1 from dependents
      where dependents.id = credit_card_dependents.dependent_id
        and dependents.user_id = auth.uid()
    )
  );
