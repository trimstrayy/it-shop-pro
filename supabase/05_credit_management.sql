-- Credit management: payment history, SMS audit, and atomic payment recording.

alter type public.payment_mode add value if not exists 'credit';
alter type public.invoice_status add value if not exists 'partial';

alter table public.invoices
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists amount_due numeric(12,2) not null default 0;

update public.invoices
set amount_paid = case when status = 'paid' then grand_total else 0 end,
    amount_due = case when status = 'paid' then 0 else grand_total end
where amount_paid = 0 and amount_due = 0 and grand_total > 0;

alter table public.invoices
  drop constraint if exists invoices_amount_paid_check,
  drop constraint if exists invoices_amount_due_check,
  add constraint invoices_amount_paid_check check (amount_paid >= 0 and amount_paid <= grand_total),
  add constraint invoices_amount_due_check check (amount_due >= 0);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  recipient text not null,
  message text not null,
  provider text not null default 'sparrow-sms',
  status text not null check (status in ('queued', 'sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  sent_by uuid references public.profiles(id) on delete set null
);

create index if not exists invoices_credit_due_idx on public.invoices (customer_id, amount_due) where amount_due > 0;
create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id, paid_at desc);
create index if not exists sms_logs_invoice_idx on public.sms_logs (invoice_id, created_at desc);

alter table public.invoice_payments enable row level security;
drop policy if exists "invoice_payments_authenticated_all" on public.invoice_payments;
create policy "invoice_payments_authenticated_all" on public.invoice_payments
for all to authenticated using (true) with check (true);

alter table public.sms_logs enable row level security;
drop policy if exists "sms_logs_authenticated_select" on public.sms_logs;
create policy "sms_logs_authenticated_select" on public.sms_logs
for select to authenticated using (true);

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_recorded_by uuid
)
returns public.invoice_payments
language plpgsql
security invoker
set search_path = public
as $$
declare
  locked_invoice public.invoices;
  inserted_payment public.invoice_payments;
  applied_amount numeric(12,2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select * into locked_invoice from public.invoices where id = p_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if locked_invoice.amount_due <= 0 then raise exception 'Invoice is already paid'; end if;

  applied_amount := least(round(p_amount, 2), locked_invoice.amount_due);
  insert into public.invoice_payments (invoice_id, amount, recorded_by)
  values (p_invoice_id, applied_amount, p_recorded_by)
  returning * into inserted_payment;

  update public.invoices
  set amount_paid = locked_invoice.amount_paid + applied_amount,
      amount_due = locked_invoice.amount_due - applied_amount,
      status = case when locked_invoice.amount_due - applied_amount <= 0 then 'paid'::public.invoice_status else 'partial'::public.invoice_status end,
      paid_at = case when locked_invoice.amount_due - applied_amount <= 0 then now() else paid_at end,
      updated_at = now()
  where id = p_invoice_id;

  return inserted_payment;
end;
$$;

revoke all on function public.record_invoice_payment(uuid, numeric, uuid) from public;
grant execute on function public.record_invoice_payment(uuid, numeric, uuid) to authenticated;