alter table dependent_transactions
  add column if not exists manual_paid_installments smallint;

update dependent_transactions t
set manual_paid_installments = case
  when exists (
    select 1 from transaction_payments p where p.transaction_id = t.id
  ) then 0
  else coalesce(t.paid_installments, 0)
end
where t.manual_paid_installments is null;

alter table dependent_transactions
  alter column manual_paid_installments set default 0,
  alter column manual_paid_installments set not null;

comment on column dependent_transactions.manual_paid_installments is
  'Installments marked manually; logged transaction_payments are counted separately.';
