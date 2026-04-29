-- LumeFin — Migration 001
-- Initial schema: dependents, bill_categories, bills,
-- bill_dependents, credit_cards, dependent_transactions

-- Dependentes
create table dependents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null check (relationship in (
    'mae','pai','avo','avoa','irmao','irma','tio','tia','outro'
  )),
  notes text,
  created_at timestamptz default now()
);

-- Categorias de conta
create table bill_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  is_system boolean not null default false,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Contas
create table bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references bill_categories(id),
  amount numeric(10,2) not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  paid_date timestamptz,
  reference_month text not null check (reference_month ~ '^\d{4}-\d{2}$'),
  notes text,
  created_at timestamptz default now(),
  constraint bills_due_date_check
    check (due_date >= '2000-01-01' and due_date <= '2100-12-31')
);

-- Join table: conta <-> dependentes
create table bill_dependents (
  bill_id uuid not null references bills(id) on delete cascade,
  dependent_id uuid not null references dependents(id) on delete cascade,
  primary key (bill_id, dependent_id)
);

-- Cartões de crédito
create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dependent_id uuid references dependents(id),
  name text not null,
  due_date date not null,
  closing_day smallint not null,
  invoice_amount numeric(10,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed','paid')),
  paid_date timestamptz,
  reference_month text not null check (reference_month ~ '^\d{4}-\d{2}$'),
  color text default '#6B7280',
  notes text,
  created_at timestamptz default now(),
  constraint credit_cards_due_date_check
    check (due_date >= '2000-01-01' and due_date <= '2100-12-31')
);

-- Transacções entre usuário e dependentes
create table dependent_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dependent_id uuid not null references dependents(id),
  transaction_date date not null,
  description text not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('to_pay','to_receive')),
  payment_type text not null check (payment_type in ('cash','installment')),
  installments smallint default 1,
  paid_installments smallint default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  settled_date timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Perfis de usuário
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  updated_at timestamptz default now()
);
