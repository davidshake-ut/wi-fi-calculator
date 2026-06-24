'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import {
  getPsaSnapshot,
  getPsaServerSnapshot,
  subscribePsa,
  writePsa,
  newPsaId,
} from '@/lib/psaLocalStore';

// Single project detail: milestones, tasks, time entries, team members, and technology sections.
export function usePSAProject(projectId, session) {
  const supabase = getSupabase();
  const localData = useSyncExternalStore(subscribePsa, getPsaSnapshot, getPsaServerSnapshot);

  const [remoteProject,        setRemoteProject]        = useState(null);
  const [remoteMilestones,     setRemoteMilestones]     = useState([]);
  const [remoteTasks,          setRemoteTasks]          = useState([]);
  const [remoteTimeEntries,    setRemoteTimeEntries]    = useState([]);
  const [remoteTechnologies,   setRemoteTechnologies]   = useState([]);
  const [members,              setMembers]              = useState([]);
  const [loading,              setLoading]              = useState(false);

  const project      = supabase ? remoteProject      : (localData.projects.find((p) => p.id === projectId) ?? null);
  const milestones   = supabase ? remoteMilestones   : localData.milestones.filter((m) => m.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.created_at?.localeCompare(b.created_at));
  const tasks        = supabase ? remoteTasks        : localData.tasks.filter((t) => t.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.created_at?.localeCompare(b.created_at));
  const timeEntries  = supabase ? remoteTimeEntries  : localData.time_entries.filter((e) => e.project_id === projectId).sort((a, b) => b.logged_date?.localeCompare(a.logged_date));
  const technologies = supabase ? remoteTechnologies : (localData.technologies ?? []).filter((t) => t.project_id === projectId).sort((a, b) => a.order_index - b.order_index);

  const refresh = useCallback(async () => {
    if (!supabase || !projectId) return;
    setLoading(true);
    const [projRes, msRes, taskRes, timeRes, memRes, techRes] = await Promise.all([
      supabase.from('psa_projects').select('*, saved_projects(project_name)').eq('id', projectId).single(),
      supabase.from('psa_milestones').select('*').eq('project_id', projectId).order('sort_order').order('created_at'),
      supabase.from('psa_tasks').select('*').eq('project_id', projectId).order('sort_order').order('created_at'),
      supabase.from('psa_time_entries').select('*, users(full_name, email)').eq('project_id', projectId).order('logged_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('users').select('id, full_name, email').order('full_name'),
      supabase.from('project_technologies').select('*').eq('project_id', projectId).order('order_index'),
    ]);
    setRemoteProject(projRes.data ?? null);
    setRemoteMilestones(msRes.data ?? []);
    setRemoteTasks(taskRes.data ?? []);
    setRemoteTimeEntries(timeRes.data ?? []);
    setMembers(memRes.data ?? []);
    setRemoteTechnologies(techRes.data ?? []);
    setLoading(false);
  }, [supabase, projectId]);

  useEffect(() => {
    if (!projectId || !supabase || !session) return;
    void (async () => { await refresh(); })();
  }, [supabase, session, projectId, refresh]);

  // ---- Project ----
  const updateProject = useCallback(
    async (data) => {
      const now = new Date().toISOString();
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, ...data, updated_at: now } : p
          ),
        }));
        return;
      }
      const { error } = await supabase
        .from('psa_projects')
        .update({ ...data, updated_at: now })
        .eq('id', projectId);
      if (error) throw error;
      await refresh();
    },
    [supabase, projectId, refresh]
  );

  // ---- Milestones ----
  const nextSortOrder = (arr) =>
    arr.length ? Math.max(...arr.map((x) => x.sort_order ?? 0)) + 10 : 0;

  const createMilestone = useCallback(
    async (data) => {
      const now = new Date().toISOString();
      const sort_order = nextSortOrder(milestones);
      if (!supabase) {
        const m = { id: newPsaId(), project_id: projectId, ...data, sort_order, created_at: now };
        writePsa((s) => ({ ...s, milestones: [...s.milestones, m] }));
        return m;
      }
      const { data: m, error } = await supabase
        .from('psa_milestones')
        .insert({ project_id: projectId, ...data, sort_order })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return m;
    },
    [supabase, projectId, milestones, refresh]
  );

  const updateMilestone = useCallback(
    async (id, data) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...data } : m)),
        }));
        return;
      }
      const { error } = await supabase.from('psa_milestones').update(data).eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteMilestone = useCallback(
    async (id) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          milestones: s.milestones.filter((m) => m.id !== id),
          tasks: s.tasks.map((t) => (t.milestone_id === id ? { ...t, milestone_id: null } : t)),
        }));
        return;
      }
      const { error } = await supabase.from('psa_milestones').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  // ---- Tasks ----
  const createTask = useCallback(
    async (data) => {
      const now = new Date().toISOString();
      const sort_order = nextSortOrder(tasks.filter((t) => t.milestone_id === (data.milestone_id ?? null)));
      if (!supabase) {
        const t = { id: newPsaId(), project_id: projectId, ...data, sort_order, created_at: now };
        writePsa((s) => ({ ...s, tasks: [...s.tasks, t] }));
        return t;
      }
      const { data: t, error } = await supabase
        .from('psa_tasks')
        .insert({ project_id: projectId, ...data, sort_order })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return t;
    },
    [supabase, projectId, tasks, refresh]
  );

  const updateTask = useCallback(
    async (id, data) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        return;
      }
      const { error } = await supabase.from('psa_tasks').update(data).eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteTask = useCallback(
    async (id) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          tasks: s.tasks.filter((t) => t.id !== id),
          time_entries: s.time_entries.map((e) =>
            e.task_id === id ? { ...e, task_id: null } : e
          ),
        }));
        return;
      }
      const { error } = await supabase.from('psa_tasks').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  // ---- Time entries ----
  const logTime = useCallback(
    async (data) => {
      const now = new Date().toISOString();
      if (!supabase) {
        const e = { id: newPsaId(), project_id: projectId, ...data, user_id: 'local', created_at: now };
        writePsa((s) => ({ ...s, time_entries: [e, ...s.time_entries] }));
        return e;
      }
      const { data: e, error } = await supabase
        .from('psa_time_entries')
        .insert({ project_id: projectId, ...data })
        .select('*, users(full_name, email)')
        .single();
      if (error) throw error;
      await refresh();
      return e;
    },
    [supabase, projectId, refresh]
  );

  const deleteTimeEntry = useCallback(
    async (id) => {
      if (!supabase) {
        writePsa((s) => ({ ...s, time_entries: s.time_entries.filter((e) => e.id !== id) }));
        return;
      }
      const { error } = await supabase.from('psa_time_entries').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  // ---- Batch reorder / move ----
  const batchUpdateMilestones = useCallback(
    async (updates) => {
      // updates: [{ id, sort_order, technology_id?, ... }]
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          milestones: s.milestones.map((m) => {
            const u = updates.find((u) => u.id === m.id);
            const { id: _id, ...rest } = u ?? {};
            return u ? { ...m, ...rest } : m;
          }),
        }));
        return;
      }
      await Promise.all(
        updates.map(({ id, ...data }) =>
          supabase.from('psa_milestones').update(data).eq('id', id)
        )
      );
      await refresh();
    },
    [supabase, refresh]
  );

  const batchUpdateTasks = useCallback(
    async (updates) => {
      // updates: [{ id, sort_order?, milestone_id?, technology_id?, ... }]
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          tasks: s.tasks.map((t) => {
            const u = updates.find((u) => u.id === t.id);
            const { id: _id, ...rest } = u ?? {};
            return u ? { ...t, ...rest } : t;
          }),
        }));
        return;
      }
      await Promise.all(
        updates.map(({ id, ...data }) =>
          supabase.from('psa_tasks').update(data).eq('id', id)
        )
      );
      await refresh();
    },
    [supabase, refresh]
  );

  // Move a milestone (and all its tasks) to a different technology section.
  const moveMilestoneToSection = useCallback(
    async (milestoneId, toTechnologyId) => {
      const taskIds = tasks.filter((t) => t.milestone_id === milestoneId).map((t) => t.id);
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          milestones: s.milestones.map((m) =>
            m.id === milestoneId ? { ...m, technology_id: toTechnologyId } : m
          ),
          tasks: s.tasks.map((t) =>
            taskIds.includes(t.id) ? { ...t, technology_id: toTechnologyId } : t
          ),
        }));
        return;
      }
      await supabase
        .from('psa_milestones')
        .update({ technology_id: toTechnologyId })
        .eq('id', milestoneId);
      if (taskIds.length > 0) {
        await supabase
          .from('psa_tasks')
          .update({ technology_id: toTechnologyId })
          .in('id', taskIds);
      }
      await refresh();
    },
    [supabase, tasks, refresh]
  );

  // Merge one technology section into another: move all milestones + tasks then delete the section.
  const mergeTechnologies = useCallback(
    async (fromId, toId) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          milestones: s.milestones.map((m) =>
            m.technology_id === fromId ? { ...m, technology_id: toId } : m
          ),
          tasks: s.tasks.map((t) =>
            t.technology_id === fromId ? { ...t, technology_id: toId } : t
          ),
          technologies: (s.technologies ?? []).filter((t) => t.id !== fromId),
        }));
        return;
      }
      await supabase
        .from('psa_milestones')
        .update({ technology_id: toId })
        .eq('technology_id', fromId)
        .eq('project_id', projectId);
      await supabase
        .from('psa_tasks')
        .update({ technology_id: toId })
        .eq('technology_id', fromId)
        .eq('project_id', projectId);
      await supabase.from('project_technologies').delete().eq('id', fromId);
      await refresh();
    },
    [supabase, projectId, refresh]
  );

  // ---- Technologies ----
  const createTechnology = useCallback(
    async (data) => {
      const now = new Date().toISOString();
      const order_index = technologies.length;
      if (!supabase) {
        const tech = { id: newPsaId(), project_id: projectId, company_id: 'local', ...data, order_index, created_at: now };
        writePsa((s) => ({ ...s, technologies: [...(s.technologies ?? []), tech] }));
        return tech;
      }
      const { data: proj } = await supabase.from('psa_projects').select('company_id').eq('id', projectId).single();
      const { data: tech, error } = await supabase
        .from('project_technologies')
        .insert({ project_id: projectId, company_id: proj?.company_id, ...data, order_index })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return tech;
    },
    [supabase, projectId, technologies, refresh]
  );

  const updateTechnology = useCallback(
    async (id, data) => {
      if (!supabase) {
        writePsa((s) => ({
          ...s,
          technologies: (s.technologies ?? []).map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        return;
      }
      const { error } = await supabase.from('project_technologies').update(data).eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteTechnology = useCallback(
    async (id) => {
      if (!supabase) {
        writePsa((s) => ({ ...s, technologies: (s.technologies ?? []).filter((t) => t.id !== id) }));
        return;
      }
      const { error } = await supabase.from('project_technologies').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [supabase, refresh]
  );

  // Apply a template (system or DB) to a specific technology section.
  // Creates milestones + tasks scoped to technologyId, with due dates from startDate.
  const applyTemplate = useCallback(
    async (template, technologyId, startDate) => {
      const phases = template.phases ?? [];
      let dayOffset = 0;
      let sortBase = milestones.filter((m) => m.technology_id === technologyId).length * 10;

      for (const phase of phases) {
        const phaseDays = phase.tasks.reduce((sum, t) => sum + Number(t.duration_days ?? 1), 0);
        const dueDate = startDate
          ? addBusinessDays(new Date(startDate), dayOffset + phaseDays)
          : null;
        const sort_order = sortBase;
        sortBase += 10;

        let milestone;
        if (!supabase) {
          const now = new Date().toISOString();
          milestone = { id: newPsaId(), project_id: projectId, technology_id: technologyId, name: phase.name, sort_order, due_date: dueDate?.toISOString().slice(0, 10) ?? null, created_at: now };
          writePsa((s) => ({ ...s, milestones: [...s.milestones, milestone] }));
        } else {
          const { data: ms, error: msErr } = await supabase
            .from('psa_milestones')
            .insert({ project_id: projectId, technology_id: technologyId, name: phase.name, sort_order, due_date: dueDate?.toISOString().slice(0, 10) ?? null })
            .select()
            .single();
          if (msErr) throw msErr;
          milestone = ms;
        }

        for (const templateTask of phase.tasks) {
          const hrs = Number(templateTask.duration_days ?? 1) * 8;
          const taskSort = (templateTask.order ?? templateTask.order_index ?? 0) * 10;

          if (!supabase) {
            const now = new Date().toISOString();
            writePsa((s) => ({
              ...s,
              tasks: [...s.tasks, { id: newPsaId(), project_id: projectId, milestone_id: milestone.id, technology_id: technologyId, title: templateTask.name, description: templateTask.description ?? '', role: templateTask.role ?? '', status: 'todo', estimated_hours: hrs, sort_order: taskSort, created_at: now }],
            }));
          } else {
            const { error: tErr } = await supabase.from('psa_tasks').insert({
              project_id: projectId,
              milestone_id: milestone.id,
              technology_id: technologyId,
              title: templateTask.name,
              description: templateTask.description ?? '',
              role: templateTask.role ?? '',
              status: 'todo',
              estimated_hours: hrs,
              sort_order: taskSort,
            });
            if (tErr) throw tErr;
          }
        }
        dayOffset += phaseDays;
      }
      await refresh();
    },
    [supabase, projectId, milestones, refresh]
  );

  return {
    project,
    milestones,
    tasks,
    timeEntries,
    technologies,
    members,
    loading,
    refresh,
    updateProject,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
    logTime,
    deleteTimeEntry,
    createTechnology,
    updateTechnology,
    deleteTechnology,
    applyTemplate,
    batchUpdateMilestones,
    batchUpdateTasks,
    moveMilestoneToSection,
    mergeTechnologies,
  };
}

// Add N business days (Mon-Fri) to a date.
function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}
