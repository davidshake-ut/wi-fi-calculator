'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { getSupportSnapshot, getSupportServerSnapshot, subscribeSupport, writeSupport, newSupportId } from '@/lib/supportLocalStore';

export function useSupportTickets(session, company, user) {
  const supabase = getSupabase();
  const localData = useSyncExternalStore(subscribeSupport, getSupportSnapshot, getSupportServerSnapshot);
  const companyId = company?.id;
  const userId    = user?.id;

  const [remoteTickets, setRemoteTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*, crm_accounts(name)')
      .order('created_at', { ascending: false });
    setRemoteTickets(data ?? []);
    setLoading(false);
  }, [supabase, companyId]);

  useEffect(() => {
    if (!supabase || !session || !companyId) return;
    void (async () => { await refresh(); })();
  }, [supabase, session, companyId, refresh]);

  const tickets = supabase ? remoteTickets : localData.tickets;

  const createTicket = useCallback(async (data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      const t = { id: newSupportId(), company_id: 'local', ...data, created_at: now, updated_at: now };
      writeSupport((s) => ({ ...s, tickets: [t, ...s.tickets] }));
      return t;
    }
    const { data: t, error } = await supabase
      .from('support_tickets')
      .insert({ company_id: companyId, created_by: userId, ...data })
      .select('*, crm_accounts(name)')
      .single();
    if (error) throw error;
    await refresh();
    return t;
  }, [supabase, companyId, userId, refresh]);

  const updateTicket = useCallback(async (id, data) => {
    const now = new Date().toISOString();
    if (!supabase) {
      writeSupport((s) => ({ ...s, tickets: s.tickets.map((t) => t.id === id ? { ...t, ...data, updated_at: now } : t) }));
      return;
    }
    const { error } = await supabase.from('support_tickets').update({ ...data, updated_at: now }).eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteTicket = useCallback(async (id) => {
    if (!supabase) {
      writeSupport((s) => ({
        ...s,
        tickets:  s.tickets.filter((t) => t.id !== id),
        comments: s.comments.filter((c) => c.ticket_id !== id),
      }));
      return;
    }
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  return { tickets, loading, refresh, createTicket, updateTicket, deleteTicket };
}
