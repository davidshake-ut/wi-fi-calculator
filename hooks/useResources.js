'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { getResourcesSnapshot, getResourcesServerSnapshot, subscribeResources, writeResources, newResourceId } from '@/lib/resourcesLocalStore';

export function useResources(session, company, user) {
  const supabase = getSupabase();
  const localData = useSyncExternalStore(subscribeResources, getResourcesSnapshot, getResourcesServerSnapshot);
  const companyId = company?.id;
  const userId    = user?.id;

  const [remoteResources, setRemoteResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('category')
      .order('title');
    setRemoteResources(data ?? []);
    setLoading(false);
  }, [supabase, companyId]);

  useEffect(() => {
    if (!supabase || !session || !companyId) return;
    void (async () => { await refresh(); })();
  }, [supabase, session, companyId, refresh]);

  const resources = supabase ? remoteResources : localData.resources;

  const createResource = useCallback(async (data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      const r = { id: newResourceId(), company_id: 'local', ...data, created_at: now, updated_at: now };
      writeResources((s) => ({ ...s, resources: [...s.resources, r] }));
      return r;
    }
    const { data: r, error } = await supabase
      .from('resources')
      .insert({ company_id: companyId, created_by: userId, ...data })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return r;
  }, [supabase, companyId, userId, refresh]);

  const updateResource = useCallback(async (id, data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      writeResources((s) => ({ ...s, resources: s.resources.map((r) => r.id === id ? { ...r, ...data, updated_at: now } : r) }));
      return;
    }
    const { error } = await supabase.from('resources').update({ ...data, updated_at: now }).eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteResource = useCallback(async (id) => {
    if (!supabase) {
      writeResources((s) => ({ ...s, resources: s.resources.filter((r) => r.id !== id) }));
      return;
    }
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  return { resources, loading, refresh, createResource, updateResource, deleteResource };
}
