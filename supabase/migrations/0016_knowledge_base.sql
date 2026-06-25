-- Knowledge Base: groups + documents with full-text search

create table if not exists public.kb_groups (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies(id) on delete cascade,
  name        text        not null,
  color       text        not null default 'blue',
  order_index int         not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.kb_documents (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies(id) on delete cascade,
  group_id     uuid        references public.kb_groups(id) on delete set null,
  name         text        not null,
  description  text,
  file_path    text,
  file_type    text        not null default 'text',
  file_size    bigint,
  content_text text,
  content_ts   tsvector    generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(content_text, '')
    )
  ) stored,
  tags         text[]      not null default '{}',
  created_by   uuid        references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists kb_documents_fts on public.kb_documents using gin(content_ts);
create index if not exists kb_documents_co  on public.kb_documents (company_id, created_at desc);
create index if not exists kb_groups_co     on public.kb_groups    (company_id, order_index);

alter table public.kb_groups    enable row level security;
alter table public.kb_documents enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='kb_groups' and policyname='tenant_rw') then
    create policy "tenant_rw" on public.kb_groups
      using  (company_id = public.current_user_company())
      with check (company_id = public.current_user_company());
  end if;
  if not exists (select 1 from pg_policies where tablename='kb_documents' and policyname='tenant_rw') then
    create policy "tenant_rw" on public.kb_documents
      using  (company_id = public.current_user_company())
      with check (company_id = public.current_user_company());
  end if;
end $$;

-- Full-text search with ranked excerpts. Uses websearch_to_tsquery so natural
-- language queries ("wi-fi setup guide") just work without special syntax.
create or replace function public.search_kb(
  p_query    text,
  p_group_id uuid default null,
  p_type     text default null
)
returns table (
  id          uuid,
  name        text,
  description text,
  group_id    uuid,
  file_type   text,
  file_size   bigint,
  file_path   text,
  created_at  timestamptz,
  rank        real,
  headline    text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.name,
    d.description,
    d.group_id,
    d.file_type,
    d.file_size,
    d.file_path,
    d.created_at,
    ts_rank_cd(d.content_ts, q) as rank,
    ts_headline(
      'english',
      coalesce(d.content_text, d.description, ''),
      q,
      'StartSel=⟦, StopSel=⟧, MaxWords=40, MinWords=15, MaxFragments=3, FragmentDelimiter= … '
    ) as headline
  from
    public.kb_documents d,
    websearch_to_tsquery('english', p_query) q
  where
    d.company_id = public.current_user_company()
    and d.content_ts @@ q
    and (p_group_id is null or d.group_id = p_group_id)
    and (p_type     is null or d.file_type = p_type)
  order by ts_rank_cd(d.content_ts, q) desc, d.created_at desc
  limit 50;
$$;

-- Storage bucket for uploaded documents (50 MB max per file)
insert into storage.buckets (id, name, public, file_size_limit)
values ('kb-documents', 'kb-documents', false, 52428800)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='kb_insert') then
    create policy "kb_insert" on storage.objects for insert
      with check (bucket_id = 'kb-documents' and auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='kb_select') then
    create policy "kb_select" on storage.objects for select
      using (bucket_id = 'kb-documents' and auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='kb_delete') then
    create policy "kb_delete" on storage.objects for delete
      using (bucket_id = 'kb-documents' and auth.role() = 'authenticated');
  end if;
end $$;
