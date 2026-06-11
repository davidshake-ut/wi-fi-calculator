import { getServiceClient, getCaller } from '@/lib/supabase/server';

const json = (body, status = 200) => Response.json(body, { status });

// Invite a person into a team by email.
//   - super_admin: invite into any team (must specify companyId) — used to seed
//     a new team's first Admin.
//   - company_admin: invite into their OWN team only.
// Roles are limited to 'user' and 'company_admin' (super_admin is bootstrap-only).
export async function POST(request) {
  const caller = await getCaller(request);
  if (!caller) return json({ error: 'Unauthorized' }, 401);

  const isSuper = caller.role === 'super_admin';
  const isAdmin = caller.role === 'company_admin';
  if (!isSuper && !isAdmin) return json({ error: 'Forbidden' }, 403);

  const { email, companyId: reqCompanyId, role = 'user' } = await request.json();
  if (!email) return json({ error: 'Missing email' }, 400);
  if (!['user', 'company_admin'].includes(role)) {
    return json({ error: 'Role must be user or company_admin' }, 400);
  }

  // Company admins can only invite into their own team.
  const companyId = isSuper ? reqCompanyId : caller.company_id;
  if (!companyId) {
    return json({ error: isSuper ? 'Select a team for the invite' : 'No team context' }, 400);
  }

  const svc = getServiceClient();
  // Send invitees to the set-password page after they accept.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  const { data, error } = await svc.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/welcome`,
  });
  if (error) return json({ error: error.message }, 400);

  // The on_auth_user_created trigger inserts the public.users row; set the
  // team + role on top of it — but never pull a user out of a team they already
  // belong to (a non-super inviter can't hijack another team's member).
  const id = data?.user?.id;
  if (id) {
    const { data: existing } = await svc
      .from('users')
      .select('company_id')
      .eq('id', id)
      .single();
    if (existing?.company_id && existing.company_id !== companyId && !isSuper) {
      return json({ error: 'That email already belongs to another team.' }, 409);
    }
    await svc
      .from('users')
      .upsert({ id, email, role, company_id: companyId }, { onConflict: 'id' });
  }
  return json({ ok: true, userId: id });
}
