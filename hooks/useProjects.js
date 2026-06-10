'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { DEFAULT_INPUTS, DEFAULT_CAMERA_INPUTS } from '@/lib/defaults';

// In local mode (no Supabase) projects are persisted to localStorage so the
// user can still save and reopen projects. Rows use the same column shape as
// the saved_projects table (project_name, inputs, price_overrides, …) so the
// rest of the app treats local and remote projects identically.
//
// The local store is exposed via useSyncExternalStore so reads are
// hydration-safe (server snapshot is empty, matching SSR) and update without
// synchronous setState-in-effect.
const LOCAL_KEY = 'wifibuilder.projects';
const EMPTY_LOCAL = [];
const localListeners = new Set();
let localCache = null; // last parsed array (stable reference between changes)
let localCacheRaw = null; // raw string localCache was parsed from

function getLocalSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCAL_KEY);
  if (raw === localCacheRaw && localCache !== null) return localCache;
  localCacheRaw = raw;
  try {
    const parsed = JSON.parse(raw);
    localCache = Array.isArray(parsed) ? parsed : EMPTY_LOCAL;
  } catch {
    localCache = EMPTY_LOCAL;
  }
  return localCache;
}

function getLocalServerSnapshot() {
  return EMPTY_LOCAL;
}

function subscribeLocal(callback) {
  localListeners.add(callback);
  const onStorage = (e) => {
    if (e.key === LOCAL_KEY || e.key === null) callback();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    localListeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function writeLocal(list) {
  if (typeof window === 'undefined') return;
  const raw = JSON.stringify(list);
  window.localStorage.setItem(LOCAL_KEY, raw);
  localCache = list;
  localCacheRaw = raw;
  localListeners.forEach((cb) => cb());
}

// Fresh mutable copy of the local list for save/delete (never mutate the
// snapshot reference React is holding).
function readLocalArray() {
  return [...getLocalSnapshot()];
}

function newLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// CRUD over saved_projects. RLS scopes rows to the user's company
// (super_admin sees all), so we never filter by company on the client.
export function useProjects(session, company, user) {
  const supabase = getSupabase();
  const localProjects = useSyncExternalStore(subscribeLocal, getLocalSnapshot, getLocalServerSnapshot);
  const [remoteProjects, setRemoteProjects] = useState([]);
  const projects = supabase ? remoteProjects : localProjects;

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('saved_projects')
      .select('*')
      .order('updated_at', { ascending: false });
    setRemoteProjects(data || []);
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) return;
    void (async () => {
      await refresh();
    })();
  }, [supabase, session, refresh]);

  // Merge with DEFAULT_INPUTS so projects saved before a field existed still load.
  const loadProject = useCallback((project) => {
    return {
      inputs: { ...DEFAULT_INPUTS, ...(project.inputs || {}) },
      cameraInputs: { ...DEFAULT_CAMERA_INPUTS, ...(project.camera_inputs || {}) },
      priceOverrides: project.price_overrides || {},
      serviceOverrides: project.service_overrides || {},
      customLineItems: project.custom_line_items || [],
    };
  }, []);

  const saveProject = useCallback(
    async ({ id, projectName, inputs, cameraInputs, priceOverrides, serviceOverrides, customLineItems }) => {
      if (!supabase) {
        const now = new Date().toISOString();
        const list = readLocalArray();
        let saved;
        if (id) {
          const idx = list.findIndex((p) => p.id === id);
          saved = {
            ...(idx >= 0 ? list[idx] : {}),
            id,
            project_name: projectName,
            inputs,
            camera_inputs: cameraInputs,
            price_overrides: priceOverrides,
            service_overrides: serviceOverrides,
            custom_line_items: customLineItems,
            updated_at: now,
          };
          if (idx >= 0) list[idx] = saved;
          else list.push(saved);
        } else {
          saved = {
            id: newLocalId(),
            project_name: projectName,
            inputs,
            camera_inputs: cameraInputs,
            price_overrides: priceOverrides,
            service_overrides: serviceOverrides,
            custom_line_items: customLineItems,
            created_at: now,
            updated_at: now,
          };
          list.push(saved);
        }
        list.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        writeLocal(list);
        return saved;
      }
      const payload = {
        project_name: projectName,
        inputs,
        camera_inputs: cameraInputs,
        price_overrides: priceOverrides,
        service_overrides: serviceOverrides,
        custom_line_items: customLineItems,
        company_id: company?.id ?? null,
        updated_at: new Date().toISOString(),
      };
      let result;
      if (id) {
        result = await supabase.from('saved_projects').update(payload).eq('id', id).select().single();
      } else {
        result = await supabase
          .from('saved_projects')
          .insert({ ...payload, created_by: user?.id ?? null })
          .select()
          .single();
      }
      if (result.error) throw result.error;
      await refresh();
      return result.data;
    },
    [supabase, company, user, refresh]
  );

  const deleteProject = useCallback(
    async (id) => {
      if (!supabase) {
        writeLocal(readLocalArray().filter((p) => p.id !== id));
        return;
      }
      await supabase.from('saved_projects').delete().eq('id', id);
      await refresh();
    },
    [supabase, refresh]
  );

  return { projects, refresh, loadProject, saveProject, deleteProject };
}
