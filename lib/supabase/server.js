import 'server-only';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerConfigured = Boolean(url && serviceKey);

// Service-role client — bypasses RLS. Only ever used inside route handlers,
// never sent to the browser. Each handler must enforce its own role checks.
export function getServiceClient() {
  if (!isServerConfigured) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Validate the caller's bearer token and return their public.users row.
// Returns null when unauthenticated or unconfigured.
export async function getCaller(request) {
  const svc = getServiceClient();
  if (!svc) return null;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  const { data, error } = await svc.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await svc
    .from('users')
    .select('id, email, role, company_id, full_name')
    .eq('id', data.user.id)
    .single();

  return profile || { id: data.user.id, email: data.user.email, role: 'user' };
}

export function canManageCatalog(role) {
  return role === 'company_admin' || role === 'super_admin';
}
