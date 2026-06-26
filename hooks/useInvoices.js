'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

function nextInvoiceNumber(existingInvoices) {
  const year = new Date().getFullYear();
  const max  = existingInvoices.reduce((n, inv) => {
    const m = inv.invoice_number?.match(/(\d+)$/);
    return m ? Math.max(n, parseInt(m[1], 10)) : n;
  }, 0);
  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
}

export function useInvoices(session, company, user) {
  const supabase  = getSupabase();
  const companyId = company?.id;
  const userId    = user?.id;

  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, psa_projects(name), saved_projects(project_name), crm_accounts(name)')
      .order('created_at', { ascending: false });
    setInvoices(data ?? []);
    setLoading(false);
  }, [supabase, companyId]);

  useEffect(() => {
    if (!supabase || !session || !companyId) return;
    void refresh();
  }, [supabase, session, companyId, refresh]);

  const createInvoice = useCallback(async (data) => {
    if (!supabase || !companyId) return;
    const number = nextInvoiceNumber(invoices);
    const { data: inv, error } = await supabase
      .from('invoices')
      .insert({ company_id: companyId, created_by: userId, invoice_number: number, ...data })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return inv;
  }, [supabase, companyId, userId, invoices, refresh]);

  const updateInvoice = useCallback(async (id, data) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('invoices')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteInvoice = useCallback(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  return { invoices, loading, refresh, createInvoice, updateInvoice, deleteInvoice };
}
