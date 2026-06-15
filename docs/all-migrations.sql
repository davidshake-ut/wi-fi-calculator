-- ============================================================
-- wifibuilder — ALL migrations, in order. Paste into the
-- Supabase SQL Editor and click Run (safe to re-run).
-- Generated from supabase/migrations/*.sql
-- ============================================================


-- ======================================================================
-- supabase/migrations/0001_init.sql
-- ======================================================================
-- Cambium Wi-Fi BOM Calculator — initial schema, RLS, and auth trigger.
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ============================================================ TABLES ========

create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email_domain  text not null unique,
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.users (
  id          uuid primary key,            -- matches auth.users.id
  email       text not null unique,
  full_name   text,
  role        text default 'user',         -- 'user' | 'company_admin' | 'super_admin'
  company_id  uuid references public.companies(id),
  created_at  timestamptz default now()
);

create table if not exists public.saved_projects (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id),
  created_by        uuid references public.users(id),
  project_name      text not null,
  inputs            jsonb not null default '{}',
  price_overrides   jsonb not null default '{}',
  service_overrides jsonb not null default '{}',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists public.custom_products (
  id          uuid primary key default gen_random_uuid(),
  sku         text not null unique,
  description text not null,
  category    text not null,
  cost        numeric(10,2) not null,
  price       numeric(10,2) not null,
  is_deleted  boolean default false,
  is_custom   boolean default true,
  created_at  timestamptz default now()
);

-- ===================================================== HELPER FUNCTIONS ======
-- SECURITY DEFINER so they bypass RLS and avoid recursive policy evaluation
-- when policies on `users` need to read the caller's own role/company.

create or replace function public.current_user_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_user_company()
returns uuid language sql security definer stable set search_path = public as $$
  select company_id from public.users where id = auth.uid();
$$;

-- ========================================================= AUTH TRIGGER ======
-- On every new auth user, mirror a row into public.users.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================ RLS ========

alter table public.companies      enable row level security;
alter table public.users          enable row level security;
alter table public.saved_projects enable row level security;
alter table public.custom_products enable row level security;

-- companies: any authenticated user may read (needed for tenant resolution);
-- only super_admins may mutate.
drop policy if exists companies_read on public.companies;
create policy companies_read on public.companies
  for select using (auth.uid() is not null);

drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- users (fix #7): self read/update; super_admin reads & manages everyone.
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (id = auth.uid() or public.current_user_role() = 'super_admin');

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (id = auth.uid() or public.current_user_role() = 'super_admin')
  with check (id = auth.uid() or public.current_user_role() = 'super_admin');

-- saved_projects: tenant isolation (super_admin sees all).
drop policy if exists tenant_isolation on public.saved_projects;
create policy tenant_isolation on public.saved_projects
  for all using (
    company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  )
  with check (
    company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  );

-- custom_products (fix #6): everyone authenticated may read; only
-- company_admin / super_admin may write the global catalog.
drop policy if exists custom_products_read on public.custom_products;
create policy custom_products_read on public.custom_products
  for select using (auth.uid() is not null);

drop policy if exists custom_products_write on public.custom_products;
create policy custom_products_write on public.custom_products
  for all using (public.current_user_role() in ('company_admin', 'super_admin'))
  with check (public.current_user_role() in ('company_admin', 'super_admin'));


-- ======================================================================
-- supabase/migrations/0002_camera_inputs.sql
-- ======================================================================
-- Camera-systems calculator: store its inputs alongside the Wi-Fi inputs on a
-- saved project, so one project captures both the Wi-Fi and camera BOMs.
-- (Local mode persists the same `camera_inputs` field in localStorage.)

alter table public.saved_projects
  add column if not exists camera_inputs jsonb not null default '{}';


-- ======================================================================
-- supabase/migrations/0003_custom_line_items.sql
-- ======================================================================
-- Per-project custom BOM line items (ad-hoc items not in the product database).
-- Stored alongside the project; local mode persists the same field in
-- localStorage.

alter table public.saved_projects
  add column if not exists custom_line_items jsonb not null default '[]';


-- ======================================================================
-- supabase/migrations/0004_multitenant.sql
-- ======================================================================
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


-- ======================================================================
-- supabase/migrations/0005_labor_roles.sql
-- ======================================================================
-- Per-project professional-labor rate card (worker levels with cost rate, bill
-- rate, and hours). Drives all labor on the quote; replaces the old hardcoded
-- auto-generated services. Local mode persists the same field in localStorage.

alter table public.saved_projects
  add column if not exists labor_roles jsonb not null default '[]';

