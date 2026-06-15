-- Per-project professional-labor rate card (worker levels with cost rate, bill
-- rate, and hours). Drives all labor on the quote; replaces the old hardcoded
-- auto-generated services. Local mode persists the same field in localStorage.

alter table public.saved_projects
  add column if not exists labor_roles jsonb not null default '[]';
