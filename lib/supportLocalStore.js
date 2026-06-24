const LOCAL_KEY = 'fsgos.support';

const EMPTY = Object.freeze({ tickets: [], comments: [] });

const listeners = new Set();
let cache = null;
let cacheRaw = null;

export function getSupportSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCAL_KEY);
  if (raw === cacheRaw && cache !== null) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      tickets:  Array.isArray(parsed.tickets)  ? parsed.tickets  : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    cache = { tickets: [], comments: [] };
  }
  return cache;
}

export function getSupportServerSnapshot() { return EMPTY; }

export function subscribeSupport(callback) {
  listeners.add(callback);
  const handler = (e) => { if (e.key === LOCAL_KEY || e.key === null) callback(); };
  if (typeof window !== 'undefined') window.addEventListener('storage', handler);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
  };
}

export function writeSupport(updater) {
  if (typeof window === 'undefined') return;
  const current = getSupportSnapshot();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(LOCAL_KEY, raw);
  cache = next;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

export function newSupportId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
