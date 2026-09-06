-- Credit payment reminders: track payment status on invoices and expose
-- a dedicated overdue-credit query for the login-time reminder popup.
--
-- The invoices table already carries `created_at`, `amount_due` and
-- `client_phone`; this migration adds the `payment_status` lifecycle column:
--   - 'pending'  – credit balance is outstanding (default for new credit sales)
--   - 'paid'     – balance settled (or the invoice is not a credit sale)
--   - 'overdue'  – reserved for manual/flag marking; the daily reminder query
--                 derives "overdue" from pending + created_at >= 7 days.

-- 1) payment_status column
alter table public.invoices
  add column if not exists payment_status text not null default 'pending';

alter table public.invoices
  drop constraint if exists invoices_payment_status_check,
  add constraint invoices_payment_status_check
    check (payment_status in ('pending', 'paid', 'overdue'));

-- 2) Backfill existing rows: non-credit or fully-settled invoices are 'paid',
--    open credit balances remain 'pending' (7-day window is derived in the
--    query below, matching the endpoint spec).
update public.invoices
set payment_status = 'paid'
where payment_status = 'pending'
  and (payment_mode <> 'credit' or amount_due <= 0);

-- 3) Keep payment_status in sync whenever the balance moves. Manual marks
--    (e.g. Mark as Paid from the reminder popup) only update payment_status,
--    so they fall outside this trigger's column list and are preserved.
create or replace function public.auto_invoice_payment_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.payment_mode <> 'credit' or new.amount_due <= 0 then
    new.payment_status := 'paid';
  end if;
  return new;
end;
$$;

drop trigger if exists auto_invoice_payment_status on public.invoices;
create trigger auto_invoice_payment_status
before insert or update of payment_mode, amount_due, amount_paid, status on public.invoices
for each row
execute function public.auto_invoice_payment_status();

-- 4) Overdue credit endpoint: pending credit invoices older than 7 days with
--    an outstanding amount, including product details. security invoker keeps
--    Row Level Security active in the caller's context.
create or replace function public.get_overdue_credits()
returns table (
  id uuid,
  invoice_number text,
  client_name text,
  client_phone text,
  created_at timestamptz,
  amount_due numeric,
  grand_total numeric,
  items jsonb
)
language sql
security invoker
set search_path = public
as $$
  select
    inv.id,
    inv.invoice_number,
    inv.client_name,
    inv.client_phone,
    inv.created_at,
    inv.amount_due,
    inv.grand_total,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'productName', it.product_name,
          'quantity', it.quantity,
          'lineTotal', it.line_total
        ) order by it.created_at
      ) filter (where it.id is not null),
      '[]'::jsonb
    ) as items
  from public.invoices inv
  left join public.invoice_items it on it.invoice_id = inv.id
  where inv.payment_mode = 'credit'
    and inv.payment_status = 'pending'
    and inv.amount_due > 0
    and inv.created_at <= now() - interval '7 days'
  group by inv.id
  order by inv.created_at asc;
$$;

grant execute on function public.get_overdue_credits() to authenticated;

-- 5) Secondary action for the reminder popup: mark a single credit invoice as
--    paid so it stops appearing in reminder runs.
create or replace function public.mark_overdue_credit_paid(p_invoice_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.invoices
  set payment_status = 'paid'
  where id = p_invoice_id
    and payment_mode = 'credit';
$$;

grant execute on function public.mark_overdue_credit_paid(uuid) to authenticated;

-- Partial and fully-paid credit invoices remain fast to find in reminder runs.
create index if not exists invoices_overdue_credits_idx
  on public.invoices (created_at, amount_due)
  where payment_mode = 'credit' and payment_status = 'pending' and amount_due > 0;