-- LumeFin — Migration 003
-- Row Level Security policies for all tables

alter table dependents             enable row level security;
alter table bill_categories        enable row level security;
alter table bills                  enable row level security;
alter table bill_dependents        enable row level security;
alter table credit_cards           enable row level security;
alter table dependent_transactions enable row level security;
alter table profiles               enable row level security;

-- Dependentes: apenas o próprio usuário
create policy "owner" on dependents
  for all using (auth.uid() = user_id);

-- Categorias: sistema (user_id null) visível a todos + próprias
create policy "owner_or_system" on bill_categories
  for all using (user_id is null or auth.uid() = user_id);

-- Contas
create policy "owner" on bills
  for all using (auth.uid() = user_id);

-- Bill dependents: via bills do próprio usuário
create policy "owner" on bill_dependents
  for all using (
    exists (
      select 1 from bills
      where bills.id = bill_dependents.bill_id
        and bills.user_id = auth.uid()
    )
  );

-- Cartões
create policy "owner" on credit_cards
  for all using (auth.uid() = user_id);

-- Transacções
create policy "owner" on dependent_transactions
  for all using (auth.uid() = user_id);

-- Perfis
create policy "owner" on profiles
  for all using (auth.uid() = id);
