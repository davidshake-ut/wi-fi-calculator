-- Enable RLS on the _migrations table to silence the Supabase security advisory.
-- No policies are added — service_role bypasses RLS, and application code never
-- reads this table directly, so deny-all for regular roles is intentional.
ALTER TABLE public._migrations ENABLE ROW LEVEL SECURITY;
