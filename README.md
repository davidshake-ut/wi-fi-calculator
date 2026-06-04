# Cambium Managed Wi-Fi — BOM Calculator

Multi-tenant SaaS that generates itemized hardware BOMs, cnMaestro subscription
lines, professional-services estimates, and PDF/CSV exports for Cambium Wi-Fi
deployments (Hospitality, Senior Living, Multi-Family).

Built from `docs/Updates spec from Claude - CLAUDE_CODE_BUILD_GUIDE.md`.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Auth +
Postgres + RLS) · jsPDF. Deploys to Vercel.

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest — calculation-engine suite
npm run build        # production build
```

**Local mode:** with no Supabase env vars set, the app runs without auth — the
calculator, product overrides, and PDF/CSV exports all work; only login,
project save/load, and the admin panel are disabled.

## Enabling the backend

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (schema, RLS,
   `auth.users → public.users` trigger).
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — used by the `/api/*` route handlers)
4. In Supabase Auth: enable the Email provider and disable public sign-ups
   (access is invite-only via the admin panel).
5. Seed a company and promote your user to `super_admin` (set `role` in the
   `public.users` row) to reach `/admin`.

## Architecture

- `lib/calculateBOM.js` — pure calculation engine (no I/O). Unit-tested in
  `__tests__/calculateBOM.test.js`.
- `lib/catalog.js` — static base product catalog + `CORE_SKUS` guard set.
- `lib/mergeProducts.js` — merges `custom_products` overrides over the base catalog.
- `components/*` — calculator UI (input panel, BOM/services/summary tables,
  product database, admin panel).
- `app/api/products` · `app/api/invite` — privileged route handlers using the
  service-role client; each re-checks the caller's role.
- `hooks/useTenant|useProjects|useProducts` — auth/tenant resolution + data.

## Deviations from the original spec (intentional)

These were resolved during review (see the plan / critique):

1. **Single-IDF deployment yields one switch.** The IDF edge switch *is* the
   core — the spec's duplicate "Core HSIA Switch" was removed.
2. **Catalog mutations are restricted** to `company_admin` / `super_admin`
   (RLS + UI gating); regular users keep per-project price overrides.
3. **Core products cannot be deleted** and a missing SKU never crashes a BOM.
4. **`numberOfIDFs` is floored at 1**; **Wi-Fi 7 forces hallway** in the engine,
   not just the UI; `custom_products`/`users` have explicit RLS policies.
