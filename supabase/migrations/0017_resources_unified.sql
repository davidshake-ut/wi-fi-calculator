-- Extend resources table with file storage + full-text search,
-- then migrate existing kb_documents rows into it.

-- Drop type check so the column can hold any semantic label
alter table public.resources drop constraint if exists resources_type_check;

-- File storage columns
alter table public.resources
  add column if not exists file_path    text,
  add column if not exists file_size    bigint,
  add column if not exists file_type    text,
  add column if not exists content_text text;

-- Generated FTS vector (title + description + extracted file text)
alter table public.resources
  add column if not exists content_ts tsvector generated always as (
    to_tsvector('english',
      coalesce(title,        '') || ' ' ||
      coalesce(description,  '') || ' ' ||
      coalesce(content_text, '')
    )
  ) stored;

create index if not exists resources_fts on public.resources using gin(content_ts);

-- Full-text search RPC — same approach as search_kb: websearch_to_tsquery + ts_headline
create or replace function public.search_resources(
  p_query    text,
  p_category text default null,
  p_type     text default null
)
returns table (
  id          uuid,
  title       text,
  description text,
  type        text,
  category    text,
  url         text,
  file_type   text,
  file_size   bigint,
  file_path   text,
  created_at  timestamptz,
  rank        real,
  headline    text
)
language sql stable security definer set search_path = public
as $$
  select
    r.id, r.title, r.description, r.type, r.category,
    r.url, r.file_type, r.file_size, r.file_path, r.created_at,
    ts_rank_cd(r.content_ts, q)::real as rank,
    ts_headline(
      'english',
      coalesce(r.content_text, r.description, ''),
      q,
      'StartSel=⟦, StopSel=⟧, MaxWords=40, MinWords=15, MaxFragments=3, FragmentDelimiter= … '
    ) as headline
  from public.resources r, websearch_to_tsquery('english', p_query) q
  where
    r.company_id = public.current_user_company()
    and r.content_ts @@ q
    and (p_category is null or r.category = p_category)
    and (p_type     is null or r.type     = p_type)
  order by ts_rank_cd(r.content_ts, q) desc, r.created_at desc
  limit 50;
$$;

-- Migrate kb_documents → resources (group name becomes category)
insert into public.resources (
  id, company_id, title, description, type, category,
  file_path, file_size, file_type, content_text, created_by, created_at, updated_at
)
select
  d.id,
  d.company_id,
  d.name,
  d.description,
  'doc',
  coalesce(g.name, 'General'),
  d.file_path,
  d.file_size,
  d.file_type,
  d.content_text,
  d.created_by,
  d.created_at,
  d.updated_at
from public.kb_documents d
left join public.kb_groups g on g.id = d.group_id
on conflict (id) do nothing;
