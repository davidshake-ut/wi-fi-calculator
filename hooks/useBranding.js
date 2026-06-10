'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_BRANDING } from '@/lib/defaults';

// Global company branding persisted to localStorage, exposed reactively via
// useSyncExternalStore (hydration-safe: server snapshot is the default brand).
const KEY = 'wifibuilder.branding';
const listeners = new Set();
let cache = null;
let cacheRaw = null;

function getSnapshot() {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY);
  if (raw === cacheRaw && cache) return cache;
  cacheRaw = raw;
  try {
    const parsed = JSON.parse(raw);
    cache = parsed && typeof parsed === 'object' ? { ...DEFAULT_BRANDING, ...parsed } : DEFAULT_BRANDING;
  } catch {
    cache = DEFAULT_BRANDING;
  }
  return cache;
}

function getServerSnapshot() {
  return DEFAULT_BRANDING;
}

function subscribe(callback) {
  listeners.add(callback);
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) callback();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

export function setBranding(next) {
  if (typeof window === 'undefined') return;
  const merged = { ...DEFAULT_BRANDING, ...next };
  const raw = JSON.stringify(merged);
  window.localStorage.setItem(KEY, raw);
  cache = merged;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

export function useBranding() {
  const branding = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { branding, setBranding };
}
