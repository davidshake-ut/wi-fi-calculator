-- Add start_date to milestones and tasks so PMs can define date ranges
-- and the Gantt chart can render accurate bars.

alter table public.psa_milestones
  add column if not exists start_date date;

alter table public.psa_tasks
  add column if not exists start_date date;
