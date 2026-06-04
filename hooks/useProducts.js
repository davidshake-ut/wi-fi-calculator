'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mergeProducts } from '@/lib/mergeProducts';
import { BASE_PRODUCTS, CORE_SKUS } from '@/lib/catalog';

const baseSkus = new Set(BASE_PRODUCTS.map((p) => p.sku));

// Local-mode catalog edits (no Supabase). Rows mirror the custom_products table
// shape and are persisted to localStorage, exposed reactively via
// useSyncExternalStore (hydration-safe + no setState-in-effect). The mutation
// semantics mirror app/api/products/route.js: add = insert, edit = upsert by
// sku, delete = hard-delete custom / soft-delete base (core SKUs protected).
const LOCAL_KEY = 'wifibuilder.custom_products';
const EMPTY_LOCAL = [];
const localListeners = new Set();
let localCache = null;
let localCacheRaw = null;

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

function writeLocal(rows) {
  if (typeof window === 'undefined') return;
  const raw = JSON.stringify(rows);
  window.localStorage.setItem(LOCAL_KEY, raw);
  localCache = rows;
  localCacheRaw = raw;
  localListeners.forEach((cb) => cb());
}

function readLocalArray() {
  return [...getLocalSnapshot()];
}

// Loads custom_products and merges them over the static base catalog.
// In local mode the custom rows come from localStorage instead.
export function useProducts(session) {
  const supabase = getSupabase();
  const localRows = useSyncExternalStore(subscribeLocal, getLocalSnapshot, getLocalServerSnapshot);
  const [remoteRows, setRemoteRows] = useState([]);
  const customRows = supabase ? remoteRows : localRows;

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('custom_products').select('*');
    setRemoteRows(data || []);
  }, [supabase]);

  useEffect(() => {
    if (!(isSupabaseConfigured && session)) return;
    void (async () => {
      await refresh();
    })();
  }, [session, refresh]);

  // Privileged mutations go through the service-role route handler, which
  // re-checks the caller's role (company_admin / super_admin).
  const callApi = useCallback(
    async (method, body) => {
      if (!supabase || !session) throw new Error('Not authenticated');
      const res = await fetch('/api/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || `Request failed (${res.status})`);
      }
      await refresh();
      return res.json();
    },
    [supabase, session, refresh]
  );

  // --- local-mode mutations (mirror the API handlers) ---
  const addLocal = ({ sku, description, category, cost, price }) => {
    if (!sku || !description || !category) throw new Error('Missing fields');
    const rows = readLocalArray();
    if (baseSkus.has(sku) || rows.some((r) => r.sku === sku && !r.is_deleted)) {
      throw new Error(`SKU ${sku} already exists`);
    }
    writeLocal([
      ...rows.filter((r) => r.sku !== sku),
      { sku, description, category, cost: Number(cost), price: Number(price), is_custom: true, is_deleted: false },
    ]);
  };

  const editLocal = ({ sku, description, category, cost, price }) => {
    if (!sku) throw new Error('Missing sku');
    const isBase = baseSkus.has(sku);
    writeLocal([
      ...readLocalArray().filter((r) => r.sku !== sku),
      { sku, description, category, cost: Number(cost), price: Number(price), is_custom: !isBase, is_deleted: false },
    ]);
  };

  const deleteLocal = (sku) => {
    if (CORE_SKUS.has(sku)) throw new Error(`${sku} is a core product and cannot be deleted`);
    const rows = readLocalArray().filter((r) => r.sku !== sku);
    if (baseSkus.has(sku)) {
      // Soft-delete a (non-core) base product so the engine/catalog hide it.
      rows.push({ sku, description: sku, category: 'Miscellaneous', cost: 0, price: 0, is_custom: false, is_deleted: true });
    }
    writeLocal(rows);
  };

  return {
    allProducts: mergeProducts(customRows),
    refresh,
    addProduct: async (p) => (supabase ? callApi('POST', p) : addLocal(p)),
    editProduct: async (p) => (supabase ? callApi('PATCH', p) : editLocal(p)),
    deleteProduct: async (sku) => (supabase ? callApi('DELETE', { sku }) : deleteLocal(sku)),
  };
}
