-- Per-project custom BOM line items (ad-hoc items not in the product database).
-- Stored alongside the project; local mode persists the same field in
-- localStorage.

alter table public.saved_projects
  add column if not exists custom_line_items jsonb not null default '[]';
