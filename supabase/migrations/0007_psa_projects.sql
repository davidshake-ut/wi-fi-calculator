-- PSA Project Management: psa_projects, psa_milestones, psa_tasks, psa_time_entries.
-- Projects may optionally link to a System Builder quote (saved_projects.id).

-- ============================================================ TABLES =========

create table if not exists public.psa_projects (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references public.companies(id) on delete cascade,
  quote_id      uuid        references public.saved_projects(id) on delete set null,
  name          text        not null,
  customer_name text,
  status        text        not null default 'planning'
                check       (status in ('planning','active','on_hold','complete','cancelled')),
  start_date    date,
  end_date      date,
  budget        numeric(12,2),
  description   text,
  created_by    uuid        references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.psa_milestones (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.psa_projects(id) on delete cascade,
  name       text        not null,
  due_date   date,
  status     text        not null default 'pending'
             check       (status in ('pending','in_progress','complete')),
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.psa_tasks (
  id              uuid        primary key default gen_random_uuid(),
  project_id      uuid        not null references public.psa_projects(id) on delete cascade,
  milestone_id    uuid        references public.psa_milestones(id) on delete set null,
  title           text        not null,
  description     text,
  assignee_id     uuid        references public.users(id) on delete set null,
  status          text        not null default 'todo'
                  check       (status in ('todo','in_progress','done')),
  due_date        date,
  estimated_hours numeric(8,2),
  sort_order      int         not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.psa_time_entries (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.psa_projects(id) on delete cascade,
  task_id     uuid        references public.psa_tasks(id) on delete set null,
  user_id     uuid        references public.users(id) on delete set null,
  logged_date date        not null default current_date,
  hours       numeric(6,2) not null check (hours > 0),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================ RLS ==============

alter table public.psa_projects     enable row level security;
alter table public.psa_milestones   enable row level security;
alter table public.psa_tasks        enable row level security;
alter table public.psa_time_entries enable row level security;

-- Projects: team members read/write their own company's projects
create policy "psa_projects_access" on public.psa_projects
  for all
  using (
    company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  )
  with check (
    company_id = public.current_user_company()
    or public.current_user_role() = 'super_admin'
  );

-- Milestones / tasks / time entries: access via project's company membership
create policy "psa_milestones_access" on public.psa_milestones
  for all
  using (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_milestones.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_milestones.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  );

create policy "psa_tasks_access" on public.psa_tasks
  for all
  using (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_tasks.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_tasks.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  );

create policy "psa_time_entries_access" on public.psa_time_entries
  for all
  using (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_time_entries.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.psa_projects p
      where p.id = psa_time_entries.project_id
        and (p.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  );
