// Applies pending Supabase migrations via the Management API.
// Requires: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
// Tracks applied migrations in public._migrations so each file runs once.

import { readdirSync, readFileSync } from 'fs';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const token      = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !token) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function sql(query) {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

// Ensure tracking table exists
await sql(`
  create table if not exists public._migrations (
    name       text primary key,
    applied_at timestamptz not null default now()
  )
`);

// Bootstrap: if tracking table is empty but psa_projects already exists,
// the earlier migrations were applied before tracking was set up — seed them now.
const countRows = await sql('select count(*)::int as n from public._migrations');
if (countRows[0].n === 0) {
  const proofRows = await sql(
    "select 1 from information_schema.tables where table_schema='public' and table_name='psa_projects'"
  );
  if (proofRows.length > 0) {
    const alreadyApplied = [
      '0001_init.sql','0002_camera_inputs.sql','0003_custom_line_items.sql',
      '0004_multitenant.sql','0005_labor_roles.sql','0006_modules.sql',
      '0007_psa_projects.sql','0008_fix_company_cascade.sql',
      '0009_crm.sql','0010_support.sql','0011_resources.sql',
    ];
    const values = alreadyApplied.map((n) => `('${n}')`).join(',');
    await sql(`insert into public._migrations (name) values ${values} on conflict do nothing`);
    console.log(`  bootstrap: seeded ${alreadyApplied.length} pre-existing migrations into tracking table`);
  }
}

// Find which migrations have already been applied
const rows    = await sql('select name from public._migrations order by name');
const applied = new Set(rows.map((r) => r.name));

// Read migration files in order
const files = readdirSync('supabase/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  skip  ${file}`);
    continue;
  }

  console.log(`  apply ${file} ...`);
  const content = readFileSync(`supabase/migrations/${file}`, 'utf8');

  try {
    await sql(content);
    await sql(`insert into public._migrations (name) values ('${file.replace(/'/g, "''")}')`);
    console.log(`  ✓     ${file}`);
    ran++;
  } catch (err) {
    console.error(`  ✗     ${file}\n${err.message}`);
    process.exit(1);
  }
}

console.log(`\nDone — ${ran} migration(s) applied, ${applied.size} already up to date.`);
