-- preferred_vendor: which distributor/supplier the team buys this product from
alter table public.custom_products
  add column if not exists preferred_vendor text not null default '';

-- Link a System Builder quote to a CRM account
alter table public.saved_projects
  add column if not exists crm_account_id uuid references public.crm_accounts(id) on delete set null;
