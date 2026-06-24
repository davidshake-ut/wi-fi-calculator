const LOCAL_KEY = 'fsgos.crm';

const EMPTY = Object.freeze({ accounts: [], contacts: [] });

const listeners = new Set();
let cache = null;
let cacheRaw = null;

export function getCrmSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCAL_KEY);
  if (raw === cacheRaw && cache !== null) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
    };
  } catch {
    cache = { accounts: [], contacts: [] };
  }
  return cache;
}

export function getCrmServerSnapshot() { return EMPTY; }

export function subscribeCrm(callback) {
  listeners.add(callback);
  const handler = (e) => { if (e.key === LOCAL_KEY || e.key === null) callback(); };
  if (typeof window !== 'undefined') window.addEventListener('storage', handler);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
  };
}

export function writeCrm(updater) {
  if (typeof window === 'undefined') return;
  const current = getCrmSnapshot();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(LOCAL_KEY, raw);
  cache = next;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

export function newCrmId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
