const LOCAL_KEY = 'fsgos.resources';

const EMPTY = Object.freeze({ resources: [] });

const listeners = new Set();
let cache = null;
let cacheRaw = null;

export function getResourcesSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCAL_KEY);
  if (raw === cacheRaw && cache !== null) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = { resources: Array.isArray(parsed.resources) ? parsed.resources : [] };
  } catch {
    cache = { resources: [] };
  }
  return cache;
}

export function getResourcesServerSnapshot() { return EMPTY; }

export function subscribeResources(callback) {
  listeners.add(callback);
  const handler = (e) => { if (e.key === LOCAL_KEY || e.key === null) callback(); };
  if (typeof window !== 'undefined') window.addEventListener('storage', handler);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
  };
}

export function writeResources(updater) {
  if (typeof window === 'undefined') return;
  const current = getResourcesSnapshot();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(LOCAL_KEY, raw);
  cache = next;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

export function newResourceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
