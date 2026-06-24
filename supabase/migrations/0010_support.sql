-- Support: tickets and comment threads.

create table if not exists public.support_tickets (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies(id) on delete cascade,
  account_id   uuid        references public.crm_accounts(id) on delete set null,
  title        text        not null,
  description  text,
  priority     text        not null default 'medium'
               check       (priority in ('low','medium','high','critical')),
  status       text        not null default 'open'
               check       (status in ('open','in_progress','waiting','resolved','closed')),
  created_by   uuid        references public.users(id) on delete set null,
  assigned_to  uuid        references public.users(id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.support_comments (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.support_tickets(id) on delete cascade,
  user_id    uuid        references public.users(id) on delete set null,
  body       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_company_idx on public.support_tickets (company_id);
create index if not exists support_comments_ticket_idx on public.support_comments (ticket_id);

alter table public.support_tickets  enable row level security;
alter table public.support_comments enable row level security;

create policy "support_tickets_access" on public.support_tickets
  for all
  using    (company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
  with check (company_id = public.current_user_company() or public.current_user_role() = 'super_admin');

create policy "support_comments_access" on public.support_comments
  for all
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_comments.ticket_id
        and (t.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_comments.ticket_id
        and (t.company_id = public.current_user_company() or public.current_user_role() = 'super_admin')
    )
  );
