'use client';

import { useSyncExternalStore } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { DEFAULT_BRANDING } from '@/lib/defaults';

// Branding source depends on mode:
//   - team mode (Supabase configured): the signed-in user's team (companies row)
//   - local mode: a localStorage store (below), exposed via useSyncExternalStore
//     (hydration-safe: server snapshot is the default brand).
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

function setLocalBranding(next) {
  if (typeof window === 'undefined') return;
  const merged = { ...DEFAULT_BRANDING, ...next };
  const raw = JSON.stringify(merged);
  window.localStorage.setItem(KEY, raw);
  cache = merged;
  cacheRaw = raw;
  listeners.forEach((cb) => cb());
}

function companyBranding(company) {
  if (!company) return DEFAULT_BRANDING;
  return {
    companyName: company.name || '',
    logo: company.logo || null,
    primaryColor: company.primary_color || DEFAULT_BRANDING.primaryColor,
    accentColor: company.accent_color || DEFAULT_BRANDING.accentColor,
  };
}

// opts: { configured, company, onSaved } in team mode; no args in local mode.
export function useBranding(opts = {}) {
  const { configured = false, company = null, onSaved } = opts;
  // Always call the hook (Rules of Hooks); only used in local mode.
  const localBranding = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (configured) {
    const branding = companyBranding(company);
    const setBranding = async (b) => {
      const supabase = getSupabase();
      if (!supabase || !company?.id) return;
      const { error } = await supabase
        .from('companies')
        .update({
          name: b.companyName || company.name,
          logo: b.logo ?? null,
          primary_color: b.primaryColor,
          accent_color: b.accentColor,
        })
        .eq('id', company.id);
      if (error) throw error;
      if (onSaved) await onSaved();
    };
    return { branding, setBranding };
  }

  return { branding: localBranding, setBranding: setLocalBranding };
}
