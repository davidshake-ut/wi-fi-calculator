-- Camera-systems calculator: store its inputs alongside the Wi-Fi inputs on a
-- saved project, so one project captures both the Wi-Fi and camera BOMs.
-- (Local mode persists the same `camera_inputs` field in localStorage.)

alter table public.saved_projects
  add column if not exists camera_inputs jsonb not null default '{}';
