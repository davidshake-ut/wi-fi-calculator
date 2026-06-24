'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { getCrmSnapshot, getCrmServerSnapshot, subscribeCrm, writeCrm, newCrmId } from '@/lib/crmLocalStore';

export function useCRMAccount(accountId, session) {
  const supabase = getSupabase();
  const localData = useSyncExternalStore(subscribeCrm, getCrmSnapshot, getCrmServerSnapshot);

  const [remoteAccount,  setRemoteAccount]  = useState(null);
  const [remoteContacts, setRemoteContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !accountId) return;
    setLoading(true);
    const [accRes, conRes] = await Promise.all([
      supabase.from('crm_accounts').select('*').eq('id', accountId).single(),
      supabase.from('crm_contacts').select('*').eq('account_id', accountId).order('first_name'),
    ]);
    setRemoteAccount(accRes.data ?? null);
    setRemoteContacts(conRes.data ?? []);
    setLoading(false);
  }, [supabase, accountId]);

  useEffect(() => {
    if (!accountId || !supabase || !session) return;
    void (async () => { await refresh(); })();
  }, [supabase, session, accountId, refresh]);

  const account  = supabase ? remoteAccount  : (localData.accounts.find((a) => a.id === accountId) ?? null);
  const contacts = supabase ? remoteContacts : localData.contacts.filter((c) => c.account_id === accountId);

  const updateAccount = useCallback(async (data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      writeCrm((s) => ({ ...s, accounts: s.accounts.map((a) => a.id === accountId ? { ...a, ...data, updated_at: now } : a) }));
      return;
    }
    const { error } = await supabase.from('crm_accounts').update({ ...data, updated_at: now }).eq('id', accountId);
    if (error) throw error;
    await refresh();
  }, [supabase, accountId, refresh]);

  const createContact = useCallback(async (data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      const c = { id: newCrmId(), account_id: accountId, company_id: 'local', ...data, created_at: now };
      writeCrm((s) => ({ ...s, contacts: [...s.contacts, c] }));
      return c;
    }
    const { data: c, error } = await supabase
      .from('crm_contacts')
      .insert({ account_id: accountId, company_id: account?.company_id, ...data })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return c;
  }, [supabase, accountId, account?.company_id, refresh]);

  const updateContact = useCallback(async (id, data) => {
    if (!supabase) {
      writeCrm((s) => ({ ...s, contacts: s.contacts.map((c) => c.id === id ? { ...c, ...data } : c) }));
      return;
    }
    const { error } = await supabase.from('crm_contacts').update(data).eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteContact = useCallback(async (id) => {
    if (!supabase) {
      writeCrm((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }));
      return;
    }
    const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  return { account, contacts, loading, refresh, updateAccount, createContact, updateContact, deleteContact };
}
