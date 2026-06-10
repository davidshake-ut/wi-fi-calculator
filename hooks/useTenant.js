'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

// Resolves the signed-in user, their role, and their team (company).
//   1. load public.users (role, company_id)
//   2. super_admin → no single team (sees all)
//   3. company_id set → load that team
//   4. no company_id → 'no_team' (awaiting assignment by an admin)
// Membership is invite-based; there is no email-domain matching.
export function useTenant() {
  const supabase = getSupabase();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  const resolve = useCallback(
    async (activeSession) => {
      if (!supabase || !activeSession) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const authId = activeSession.user.id;
        const { data: profile, error: pErr } = await supabase
          .from('users')
          .select('id, email, full_name, role, company_id')
          .eq('id', authId)
          .single();
        if (pErr) throw pErr;
        setUser(profile);

        if (profile.role === 'super_admin') {
          setCompany(null);
        } else if (!profile.company_id) {
          setCompany(null);
          setError('no_team');
        } else {
          const { data: comp } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single();
          setCompany(comp || null);
          if (!comp) setError('no_team');
        }
      } catch (e) {
        setError(e.message || 'resolution_failed');
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      resolve(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      resolve(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, resolve]);

  const refresh = useCallback(() => resolve(session), [resolve, session]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, [supabase]);

  return {
    configured: isSupabaseConfigured,
    session,
    user,
    company,
    role: user?.role || null,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'company_admin' || user?.role === 'super_admin',
    loading,
    error,
    refresh,
    signOut,
  };
}
