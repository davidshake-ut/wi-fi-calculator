import { getServiceClient, getCaller } from '@/lib/supabase/server';

const json = (body, status = 200) => Response.json(body, { status });

export async function POST(request) {
  const caller = await getCaller(request);
  if (!caller) return json({ error: 'Unauthorized' }, 401);
  if (caller.role !== 'super_admin') return json({ error: 'Forbidden' }, 403);

  const svc = getServiceClient();
  const { email, companyId, role = 'user' } = await request.json();
  if (!email) return json({ error: 'Missing email' }, 400);

  const { data, error } = await svc.auth.admin.inviteUserByEmail(email);
  if (error) return json({ error: error.message }, 400);

  // The on_auth_user_created trigger inserts the public.users row; set the
  // company + role on top of it.
  const id = data?.user?.id;
  if (id) {
    await svc
      .from('users')
      .upsert({ id, email, role, company_id: companyId ?? null }, { onConflict: 'id' });
  }
  return json({ ok: true, userId: id });
}
