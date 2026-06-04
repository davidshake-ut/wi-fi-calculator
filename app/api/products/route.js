import { getServiceClient, getCaller, canManageCatalog } from '@/lib/supabase/server';
import { BASE_PRODUCTS, CORE_SKUS } from '@/lib/catalog';

const baseSkus = new Set(BASE_PRODUCTS.map((p) => p.sku));
const json = (body, status = 200) => Response.json(body, { status });

async function requireManager(request) {
  const caller = await getCaller(request);
  if (!caller) return { error: json({ error: 'Unauthorized' }, 401) };
  if (!canManageCatalog(caller.role)) {
    return { error: json({ error: 'Forbidden — catalog edits require company_admin or super_admin' }, 403) };
  }
  return { caller, svc: getServiceClient() };
}

export async function GET(request) {
  const caller = await getCaller(request);
  if (!caller) return json({ error: 'Unauthorized' }, 401);
  const svc = getServiceClient();
  const { data, error } = await svc.from('custom_products').select('*');
  if (error) return json({ error: error.message }, 500);
  return json({ products: data });
}

export async function POST(request) {
  const { error, svc } = await requireManager(request);
  if (error) return error;
  const body = await request.json();
  const { sku, description, category, cost, price } = body;
  if (!sku || !description || !category) return json({ error: 'Missing fields' }, 400);

  const { data, error: dbErr } = await svc
    .from('custom_products')
    .insert({ sku, description, category, cost, price, is_custom: true, is_deleted: false })
    .select()
    .single();
  if (dbErr) return json({ error: dbErr.message }, 400);
  return json({ product: data });
}

export async function PATCH(request) {
  const { error, svc } = await requireManager(request);
  if (error) return error;
  const body = await request.json();
  const { sku, description, category, cost, price } = body;
  if (!sku) return json({ error: 'Missing sku' }, 400);

  // Upsert: editing a base product writes/updates an override row keyed by sku.
  const isBase = baseSkus.has(sku);
  const { data, error: dbErr } = await svc
    .from('custom_products')
    .upsert(
      {
        sku,
        description,
        category,
        cost,
        price,
        is_custom: !isBase,
        is_deleted: false,
      },
      { onConflict: 'sku' }
    )
    .select()
    .single();
  if (dbErr) return json({ error: dbErr.message }, 400);
  return json({ product: data });
}

export async function DELETE(request) {
  const { error, svc } = await requireManager(request);
  if (error) return error;
  const { sku } = await request.json();
  if (!sku) return json({ error: 'Missing sku' }, 400);

  // Fix #3 — core SKUs the engine depends on can never be deleted.
  if (CORE_SKUS.has(sku)) {
    return json({ error: `${sku} is a core product and cannot be deleted` }, 400);
  }

  if (baseSkus.has(sku)) {
    // Soft-delete a (non-core) base product via an override row.
    const { error: dbErr } = await svc
      .from('custom_products')
      .upsert({ sku, description: sku, category: 'Miscellaneous', cost: 0, price: 0, is_deleted: true }, { onConflict: 'sku' });
    if (dbErr) return json({ error: dbErr.message }, 400);
  } else {
    // Hard-delete a pure custom product.
    const { error: dbErr } = await svc.from('custom_products').delete().eq('sku', sku);
    if (dbErr) return json({ error: dbErr.message }, 400);
  }
  return json({ ok: true });
}
