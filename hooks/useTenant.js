'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

// Resolves the signed-in user, their role, and their company.
// Mirrors the spec's tenant-resolution flow:
//   1. load public.users (role, company_id)
//   2. super_admin → skip company resolution
//   3. match company by company_id, else by email domain (and persist the match)
//   4. otherwise surface a "company not recognized" error
export function useTenant() {
  const supabase = getSupabase();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  const resolve = useCallback(async (activeSession) => {
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
        setLoading(false);
        return;
      }

      const { data: companies } = await supabase.from('companies').select('*');
      let match = null;
      if (profile.company_id) {
        match = companies?.find((c) => c.id === profile.company_id) || null;
      }
      if (!match) {
        const domain = (profile.email || '').split('@')[1]?.toLowerCase();
        match = companies?.find((c) => c.email_domain?.toLowerCase() === domain) || null;
        if (match) {
          await supabase.from('users').update({ company_id: match.id }).eq('id', authId);
        }
      }
      if (!match) {
        setError('company_not_recognized');
        setCompany(null);
      } else {
        setCompany(match);
      }
    } catch (e) {
      setError(e.message || 'resolution_failed');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // In local mode `loading` is already initialized to false (isSupabaseConfigured),
    // so there's nothing to sync — bail before touching state.
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      resolve(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      resolve(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, resolve]);

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
    loading,
    error,
    signOut,
  };
}
