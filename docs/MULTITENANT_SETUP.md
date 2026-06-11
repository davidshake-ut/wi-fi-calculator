# Multi-Tenant Setup Guide

This app can run two ways:

- **Local mode** (no setup): single user, data saved in the browser. This is the
  default and keeps working with zero configuration.
- **Team mode** (this guide): real accounts, multiple teams, each team's
  projects / product catalog / branding fully isolated from every other team.

Roles in team mode:

| Role | Can do |
|------|--------|
| **User** | Fill in / save projects, edit per-project BOM pricing & custom lines, export. |
| **Admin** (`company_admin`) | Everything a User can, **plus** edit the team's product catalog, edit branding/settings, and invite/remove members. |
| **Super admin** (you) | See and manage **every** team. The only super admin. |

Teams are created by you (the super admin); members join by invitation.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project** (the free tier is plenty to start).
2. Pick a name, a strong database password, and a region near your users.
3. Wait for it to finish provisioning (~2 min).

## 2. Run the database migrations

In the Supabase dashboard → **SQL Editor**, run each file in
`supabase/migrations/` **in order**, top to bottom:

1. `0001_init.sql` — tables, roles, row-level security, auth trigger
2. `0002_camera_inputs.sql`
3. `0003_custom_line_items.sql`
4. `0004_multitenant.sql` — per-team catalogs/settings + isolation

(Or, with the Supabase CLI: `supabase link` then `supabase db push`.)

## 3. Get your keys

Supabase recently split API keys into a new **Publishable / Secret** system and
the original **Legacy** keys. **Use the Legacy keys** — this app is built around
them and the invite flow needs the `service_role` key. (You can migrate to the
new keys later.)

- **Project URL** — Project Settings → **Data API** → copy **Project URL**
  (`https://<ref>.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`
- Project Settings → **API Keys** → open the **Legacy `anon`, `service_role`**
  section:
  - **anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role / secret** (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`

Add all three in **Vercel → your project → Settings → Environment Variables**
(Production + Preview), then **redeploy**. For local dev, put the same three in
a `.env.local` file (see `.env.example`).

> The moment these env vars exist, the app switches from local mode to team mode
> and requires sign-in.

## 4. Configure authentication

Supabase dashboard → **Authentication**:

1. **Providers → Email**: enable it. This covers both sign-in methods we use —
   **email + password** and **email login code** (one-time code / magic link).
2. **Providers → Email → "Confirm email"**: on for production.
3. **Sign-ups**: turn **OFF** "Allow new users to sign up". Membership is
   invite-only — only people you or a team Admin invite can get in.
4. **URL Configuration** (Authentication → URL Configuration) — **required**, or
   invite/login links fail with `{"error":"requested path is invalid"}`:
   - **Site URL**: your app URL, e.g. `https://wi-fi-calculator.vercel.app`
     (no trailing slash).
   - **Redirect URLs**: add `https://wi-fi-calculator.vercel.app/**` (the `/**`
     wildcard allows any path). Add any custom domain here too.
5. (Optional, recommended for volume) **Email Templates / SMTP**: Supabase's
   built-in email is rate-limited; for real use, connect your own SMTP
   (Settings → Auth → SMTP).

> **Google / Microsoft sign-in** can be added later with no app rewrite: enable
> the provider here, register an OAuth app on Google/Microsoft, paste the client
> ID/secret, and add the provider button. Ask me when you're ready.

## 5. Bootstrap yourself as super admin

1. Invite yourself first: easiest is to create your own auth user. In Supabase →
   **Authentication → Users → Add user** (set your email + a password), or use
   the app's invite once a team exists.
2. Promote yourself. SQL Editor:

   ```sql
   update public.users
   set role = 'super_admin'
   where email = 'you@yourcompany.com';
   ```

3. Sign in to the app — you now have the super-admin console (create teams,
   assign each team's first Admin).

## 6. Onboard a team

As super admin:

1. **Create a team** (name + optional logo/colors).
2. **Invite the team's first Admin** by email (role = Admin). They get an email
   to set their password, then sign in with full Admin rights.
3. That Admin invites the rest of their team (Users or more Admins) and curates
   their catalog/branding.

Each team's projects, catalog, and settings are isolated by row-level security
in the database — not just hidden in the UI — so isolation holds even against a
crafted API request.

---

## Environment variable reference

| Variable | Where | Secret? |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | no (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | **yes — never expose** |

If none are set, the app stays in local mode.
