-- CRM: accounts (customers/prospects) and contacts (people at each account).

create table if not exists public.crm_accounts (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies(id) on delete cascade,
  name         text        not null,
  type         text        not null default 'other'
               check       (type in ('hospitality','senior_living','multi_family','education','healthcare','other')),
  status       text        not null default 'prospect'
               check       (status in ('active','prospect','inactive')),
  phone        text,
  website      text,
  address      text,
  notes        text,
  created_by   uuid        references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies(id) on delete cascade,
  account_id   uuid        references public.crm_accounts(id) on delete cascade,
  first_name   text        not null,
  last_name    text,
  email        text,
  phone        text,
  title        text,
  notes        text,
  created_by   uuid        references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Indexes
create index if not exists crm_accounts_company_idx on public.crm_accounts (company_id);
create index if not exists crm_contacts_account_idx on public.crm_contacts (account_id);

-- RLS
alter table public.crm_accounts  enable row level security;
alter table public.crm_contacts  enable row level security;

create policy "crm_accounts_access" on public.crm_accounts
  for all
  using    (company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
  with check (company_id = public.current_user_company() or public.current_user_role() = 'super_admin');

create policy "crm_contacts_access" on public.crm_contacts
  for all
  using    (company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
  with check (company_id = public.current_user_company() or public.current_user_role() = 'super_admin');
