alter table cash_flow_entries
  add column is_recurring boolean not null default false;
