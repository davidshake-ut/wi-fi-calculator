-- Resources: team knowledge base — guides, datasheets, templates, links.

create table if not exists public.resources (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies(id) on delete cascade,
  title        text        not null,
  description  text,
  type         text        not null default 'doc'
               check       (type in ('guide','doc','video','template','link')),
  category     text        not null default 'General',
  url          text,
  created_by   uuid        references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists resources_company_idx  on public.resources (company_id);
create index if not exists resources_category_idx on public.resources (company_id, category);

alter table public.resources enable row level security;

create policy "resources_access" on public.resources
  for all
  using    (company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
  with check (company_id = public.current_user_company() or public.current_user_role() = 'super_admin');
