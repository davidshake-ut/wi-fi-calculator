-- Invoices table: links proposals (saved_projects) and/or PSA projects to
-- customer-facing billing documents.
create table if not exists public.invoices (
  id               uuid         primary key default gen_random_uuid(),
  company_id       uuid         not null references public.companies(id) on delete cascade,
  invoice_number   text         not null,
  title            text         not null,
  status           text         not null default 'draft'
                   check (status in ('draft','sent','paid','overdue','void')),
  quote_id         uuid         references public.saved_projects(id) on delete set null,
  project_id       uuid         references public.psa_projects(id) on delete set null,
  crm_account_id   uuid         references public.crm_accounts(id) on delete set null,
  customer_name    text,
  invoice_date     date         not null default current_date,
  due_date         date,
  line_items       jsonb        not null default '[]',
  subtotal         numeric(12,2) not null default 0,
  tax_rate         numeric(5,2)  not null default 0,
  tax_amount       numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  notes            text,
  created_by       uuid         references public.users(id) on delete set null,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

alter table public.invoices enable row level security;

create policy "invoices_access" on public.invoices
  for all
  using  (company_id = public.current_user_company())
  with check (company_id = public.current_user_company());

create index if not exists invoices_company_idx    on public.invoices(company_id);
create index if not exists invoices_project_idx    on public.invoices(project_id);
create index if not exists invoices_quote_idx      on public.invoices(quote_id);
create index if not exists invoices_status_idx     on public.invoices(status);
