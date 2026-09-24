alter table transaction_payments
  add column if not exists paid_by text;

comment on column transaction_payments.paid_by is
  'Person who actually made the payment; user_id remains the account that registered it.';
