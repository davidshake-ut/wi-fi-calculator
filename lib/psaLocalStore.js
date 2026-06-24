// Shared reactive localStorage store for PSA data in local (no-Supabase) mode.
// Uses the useSyncExternalStore pattern so reads are hydration-safe and
// components re-render when any part of the store changes — no setState-in-effect.

const LOCAL_KEY = 'fsgos.psa';

const EMPTY = Object.freeze({
  projects: [],
  milestones: [],
  tasks: [],
  time_entries: [],
});

const listeners = new Set();
let cache = null;
let cacheRaw = null;

export function getPsaSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCAL_KEY);
  if (raw === cacheRaw && cache !== null) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      projects:     Array.isArray(parsed.projects)     ? parsed.projects     : [],
      milestones:   Array.isArray(parsed.milestones)   ? parsed.milestones   : [],
      tasks:        Array.isArray(parsed.tasks)         ? parsed.tasks        : [],
      time_entries: Array.isArray(parsed.time_entries) ? parsed.time_entries : [],
    };
  } catch {
    cache = { projects: [], milestones: [], tasks: [], time_entries: [] };
  }
  return cache;
}

export function getPsaServerSnapshot() {
  return EMPTY;
}

export function subscribePsa(callback) {
  listeners.add(callback);
  const handler = (e) => {
    if (e.key === LOCAL_KEY || e.key === null) callback();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', handler);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
  };
}

// updater: (current) => next  or  a partial object to merge
export function writePsa(updater) {
  if (typeof window === 'undefined') return;
  const current = getPsaSnapshot();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(LOCAL_KEY, raw);
  cache = next;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

export function newPsaId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
