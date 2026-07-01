'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { SYSTEM_TEMPLATES } from '@/lib/templates/index';

// Manages company-owned project templates.
// System templates (from lib/templates/) are always available as read-only.
export function useTemplates(session, company, user) {
  const supabase  = getSupabase();
  const companyId = company?.id;
  const userId    = user?.id;

  const [companyTemplates, setCompanyTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !companyId) return;
    setLoading(true);
    const { data: templates } = await supabase
      .from('project_templates')
      .select('*, template_phases(*, template_tasks(*))')
      .eq('company_id', companyId)
      .order('name');
    setCompanyTemplates(templates ?? []);
    setLoading(false);
  }, [supabase, companyId]);

  useEffect(() => {
    if (!supabase || !session || !companyId) return;
    void (async () => { await refresh(); })();
  }, [supabase, session, companyId, refresh]);

  // ---- CRUD ----
  const createTemplate = useCallback(async ({ name, description = '', technology }) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('project_templates')
      .insert({ company_id: companyId, created_by: userId, name, description, technology })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data;
  }, [supabase, companyId, userId, refresh]);

  const updateTemplate = useCallback(async (id, patch) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('project_templates')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteTemplate = useCallback(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('project_templates').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const addPhase = useCallback(async (templateId, { name, order_index }) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('template_phases')
      .insert({ template_id: templateId, company_id: companyId, name, order_index })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data;
  }, [supabase, companyId, refresh]);

  const updatePhase = useCallback(async (id, patch) => {
    if (!supabase) return;
    const { error } = await supabase.from('template_phases').update(patch).eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deletePhase = useCallback(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('template_phases').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const addTask = useCallback(async (phaseId, templateId, { name, description = '', duration_days = 1, role = '', order_index = 0 }) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('template_tasks')
      .insert({ phase_id: phaseId, template_id: templateId, company_id: companyId, name, description, duration_days, role, order_index })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data;
  }, [supabase, companyId, refresh]);

  const updateTask = useCallback(async (id, patch) => {
    if (!supabase) return;
    const { error } = await supabase.from('template_tasks').update(patch).eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const deleteTask = useCallback(async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('template_tasks').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  // Clone a system template into company-owned DB rows so it can be edited.
  const cloneSystemTemplate = useCallback(async (systemTemplate) => {
    if (!supabase) return;
    const tmpl = await createTemplate({
      name: `${systemTemplate.name} (Copy)`,
      description: systemTemplate.description,
      technology: systemTemplate.technology,
    });
    for (const phase of systemTemplate.phases) {
      const ph = await addPhase(tmpl.id, { name: phase.name, order_index: phase.order });
      for (const task of phase.tasks) {
        await addTask(ph.id, tmpl.id, {
          name: task.name,
          description: task.description,
          duration_days: task.duration_days,
          role: task.role,
          order_index: task.order,
        });
      }
    }
    await refresh();
    return tmpl;
  }, [supabase, createTemplate, addPhase, addTask, refresh]);

  // Normalise a system template or a DB template into the same shape for rendering.
  function normalise(t) {
    if (t.isSystem) return t;
    return {
      ...t,
      isSystem: false,
      phases: (t.template_phases ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((ph) => ({
          ...ph,
          order: ph.order_index,
          tasks: (ph.template_tasks ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((tk) => ({ ...tk, order: tk.order_index })),
        })),
    };
  }

  const allTemplates = [
    ...SYSTEM_TEMPLATES,
    ...companyTemplates.map(normalise),
  ];

  return {
    allTemplates,
    systemTemplates: SYSTEM_TEMPLATES,
    companyTemplates: companyTemplates.map(normalise),
    loading,
    refresh,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    updateTask,
    deleteTask,
    cloneSystemTemplate,
  };
}
