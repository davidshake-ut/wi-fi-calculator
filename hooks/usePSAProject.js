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

// Single project detail: milestones, tasks, time entries, and team members.
export function usePSAProject(projectId, session) {
  const supabase = getSupabase();
  const localData = useSyncExternalStore(subscribePsa, getPsaSnapshot, getPsaServerSnapshot);

  const [remoteProject,     setRemoteProject]     = useState(null);
  const [remoteMilestones,  setRemoteMilestones]  = useState([]);
  const [remoteTasks,       setRemoteTasks]       = useState([]);
  const [remoteTimeEntries, setRemoteTimeEntries] = useState([]);
  const [members,           setMembers]           = useState([]);
  // false by default; set to true/false inside refresh() so no direct setState in useEffect
  const [loading,           setLoading]           = useState(false);

  const project     = supabase ? remoteProject     : (localData.projects.find((p) => p.id === projectId) ?? null);
  const milestones  = supabase ? remoteMilestones  : localData.milestones.filter((m) => m.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.created_at?.localeCompare(b.created_at));
  const tasks       = supabase ? remoteTasks       : localData.tasks.filter((t) => t.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.created_at?.localeCompare(b.created_at));
  const timeEntries = supabase ? remoteTimeEntries : localData.time_entries.filter((e) => e.project_id === projectId).sort((a, b) => b.logged_date?.localeCompare(a.logged_date));

  const refresh = useCallback(async () => {
    if (!supabase || !projectId) return;
    setLoading(true);
    const [projRes, msRes, taskRes, timeRes, memRes] = await Promise.all([
      supabase.from('psa_projects').select('*, saved_projects(project_name)').eq('id', projectId).single(),
      supabase.from('psa_milestones').select('*').eq('project_id', projectId).order('sort_order').order('created_at'),
      supabase.from('psa_tasks').select('*').eq('project_id', projectId).order('sort_order').order('created_at'),
      supabase.from('psa_time_entries').select('*, users(full_name, email)').eq('project_id', projectId).order('logged_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('users').select('id, full_name, email').order('full_name'),
    ]);
    setRemoteProject(projRes.data ?? null);
    setRemoteMilestones(msRes.data ?? []);
    setRemoteTasks(taskRes.data ?? []);
    setRemoteTimeEntries(timeRes.data ?? []);
    setMembers(memRes.data ?? []);
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

  return {
    project,
    milestones,
    tasks,
    timeEntries,
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
  };
}
