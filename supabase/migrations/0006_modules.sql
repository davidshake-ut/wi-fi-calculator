-- Per-tenant module configuration for FSG OS.
-- Module keys: dashboard, crm, builder, projects, support, resources.
-- A missing row for a module key means "enabled" (safe default-on).

create table if not exists public.company_modules (
  id         uuid    primary key default gen_random_uuid(),
  company_id uuid    not null references public.companies(id) on delete cascade,
  module_key text    not null check (module_key in ('dashboard','crm','builder','projects','support','resources')),
  enabled    boolean not null default true,
  unique (company_id, module_key)
);

alter table public.company_modules enable row level security;

-- Super admins manage modules for any team.
create policy "super_admin_modules_all" on public.company_modules
  for all
  using    (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- Company admins manage their own team's modules.
create policy "company_admin_modules_own" on public.company_modules
  for all
  using (
    company_id = public.current_user_company()
    and public.current_user_role() = 'company_admin'
  )
  with check (
    company_id = public.current_user_company()
    and public.current_user_role() = 'company_admin'
  );

-- All users can read their own team's module config.
create policy "user_modules_read_own" on public.company_modules
  for select
  using (company_id = public.current_user_company());
