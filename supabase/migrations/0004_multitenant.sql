-- Multi-tenant hardening: per-team catalogs + settings, super-admin-created
-- teams (invite-based membership, not domain-based), and row-level security so
-- one team can never see another team's projects, catalog, or settings.
--
-- Roles: 'user' (fill/save projects), 'company_admin' (Admin: + catalog,
-- branding, invites), 'super_admin' (you: all teams).

-- ============================================== 1) TEAMS ====================
-- Teams are created by the super admin and joined by invite, so an email
-- domain is no longer required.
alter table public.companies alter column email_domain drop not null;

-- Per-team branding / settings live on the team row.
alter table public.companies add column if not exists logo          jsonb;
alter table public.companies add column if not exists primary_color text default '#2563eb';
alter table public.companies add column if not exists accent_color  text default '#1e40af';

-- Tighten company visibility: you only see your own team (super_admin sees all).
drop policy if exists companies_read on public.companies;
create policy companies_read on public.companies
  for select using (
    id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  );

-- Only the super admin creates/removes teams.
drop policy if exists companies_write on public.companies;
drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies
  for insert with check (public.current_user_role() = 'super_admin');

drop policy if exists companies_delete on public.companies;
create policy companies_delete on public.companies
  for delete using (public.current_user_role() = 'super_admin');

-- A team Admin may update their own team (branding/name); super admin any team.
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update using (
    public.current_user_role() = 'super_admin'
    or (id = public.current_user_company() and public.current_user_role() = 'company_admin')
  )
  with check (
    public.current_user_role() = 'super_admin'
    or (id = public.current_user_company() and public.current_user_role() = 'company_admin')
  );

-- ============================================== 2) MEMBERS ==================
-- Admins can see and manage the members of their own team.
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (
    id = auth.uid()
    or company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  );

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (
    id = auth.uid()
    or (company_id = public.current_user_company() and public.current_user_role() = 'company_admin')
    or public.current_user_role() = 'super_admin'
  )
  with check (
    id = auth.uid()
    or (company_id = public.current_user_company() and public.current_user_role() = 'company_admin')
    or public.current_user_role() = 'super_admin'
  );

-- A team Admin may remove a member from their team.
drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (
    (company_id = public.current_user_company() and public.current_user_role() = 'company_admin')
    or public.current_user_role() = 'super_admin'
  );

-- ============================================ 3) PER-TEAM CATALOG ===========
-- Scope custom_products to a team. Each team starts from the built-in base
-- catalog (embedded in the app) and layers its own adds/edits/deletes here.
alter table public.custom_products
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

-- SKUs are unique within a team, not globally.
alter table public.custom_products drop constraint if exists custom_products_sku_key;
create unique index if not exists custom_products_company_sku_idx
  on public.custom_products (company_id, sku);

drop policy if exists custom_products_read on public.custom_products;
create policy custom_products_read on public.custom_products
  for select using (
    company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  );

-- Only a team's Admins (or super admin) write that team's catalog.
drop policy if exists custom_products_write on public.custom_products;
create policy custom_products_write on public.custom_products
  for all using (
    (company_id = public.current_user_company() and public.current_user_role() in ('company_admin', 'super_admin'))
    or public.current_user_role() = 'super_admin'
  )
  with check (
    (company_id = public.current_user_company() and public.current_user_role() in ('company_admin', 'super_admin'))
    or public.current_user_role() = 'super_admin'
  );

-- saved_projects already isolate by company_id (see 0001) — shared across the
-- team, invisible to other teams. No change needed.
