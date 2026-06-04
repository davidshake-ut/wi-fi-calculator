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
