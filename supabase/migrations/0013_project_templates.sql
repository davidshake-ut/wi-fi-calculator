-- Technology sections per project (e.g. "Managed Wi-Fi", "Camera Systems")
create table if not exists public.project_technologies (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.psa_projects(id)  on delete cascade,
  company_id  uuid        not null references public.companies(id)      on delete cascade,
  technology  text        not null,
  order_index int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Scope milestones and tasks to a technology section
alter table public.psa_milestones
  add column if not exists technology_id uuid references public.project_technologies(id) on delete set null;

alter table public.psa_tasks
  add column if not exists technology_id uuid references public.project_technologies(id) on delete set null,
  add column if not exists description   text not null default '',
  add column if not exists role          text not null default '';

-- Project templates
create table if not exists public.project_templates (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies(id) on delete cascade,
  name        text        not null,
  description text        not null default '',
  technology  text        not null,
  created_by  uuid        references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Phases (milestones) within a template
create table if not exists public.template_phases (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.project_templates(id) on delete cascade,
  company_id  uuid not null references public.companies(id)         on delete cascade,
  name        text not null,
  order_index int  not null default 0
);

-- Tasks within a template phase
create table if not exists public.template_tasks (
  id            uuid    primary key default gen_random_uuid(),
  phase_id      uuid    not null references public.template_phases(id)   on delete cascade,
  template_id   uuid    not null references public.project_templates(id) on delete cascade,
  company_id    uuid    not null references public.companies(id)         on delete cascade,
  name          text    not null,
  description   text    not null default '',
  duration_days numeric not null default 1,
  order_index   int     not null default 0,
  role          text    not null default ''
);

-- RLS
alter table public.project_technologies enable row level security;
alter table public.project_templates    enable row level security;
alter table public.template_phases      enable row level security;
alter table public.template_tasks       enable row level security;

create policy "tenant isolation" on public.project_technologies
  using (company_id = public.current_user_company());
create policy "tenant insert" on public.project_technologies for insert
  with check (company_id = public.current_user_company());
create policy "tenant update" on public.project_technologies for update
  using (company_id = public.current_user_company());
create policy "tenant delete" on public.project_technologies for delete
  using (company_id = public.current_user_company());

create policy "tenant isolation" on public.project_templates
  using (company_id = public.current_user_company());
create policy "tenant insert" on public.project_templates for insert
  with check (company_id = public.current_user_company());
create policy "tenant update" on public.project_templates for update
  using (company_id = public.current_user_company());
create policy "tenant delete" on public.project_templates for delete
  using (company_id = public.current_user_company());

create policy "tenant isolation" on public.template_phases
  using (company_id = public.current_user_company());
create policy "tenant insert" on public.template_phases for insert
  with check (company_id = public.current_user_company());
create policy "tenant update" on public.template_phases for update
  using (company_id = public.current_user_company());
create policy "tenant delete" on public.template_phases for delete
  using (company_id = public.current_user_company());

create policy "tenant isolation" on public.template_tasks
  using (company_id = public.current_user_company());
create policy "tenant insert" on public.template_tasks for insert
  with check (company_id = public.current_user_company());
create policy "tenant update" on public.template_tasks for update
  using (company_id = public.current_user_company());
create policy "tenant delete" on public.template_tasks for delete
  using (company_id = public.current_user_company());
