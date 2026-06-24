-- Fix FK constraints so deleting a company cascades cleanly.
--
-- Missing ON DELETE CASCADE:
--   users.company_id          → companies(id)
--   saved_projects.company_id → companies(id)
--
-- Missing ON DELETE SET NULL:
--   saved_projects.created_by → users(id)
--   (prevents FK violation when users are cascade-deleted before saved_projects
--    in the same company-delete transaction)

-- users.company_id
alter table public.users
  drop constraint if exists users_company_id_fkey;
alter table public.users
  add constraint users_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete cascade;

-- saved_projects.company_id
alter table public.saved_projects
  drop constraint if exists saved_projects_company_id_fkey;
alter table public.saved_projects
  add constraint saved_projects_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete cascade;

-- saved_projects.created_by
alter table public.saved_projects
  drop constraint if exists saved_projects_created_by_fkey;
alter table public.saved_projects
  add constraint saved_projects_created_by_fkey
    foreign key (created_by) references public.users(id) on delete set null;
