'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// When env vars are absent the app runs in local mode (no auth/persistence);
// callers check isSupabaseConfigured before using the client.
export const isSupabaseConfigured = Boolean(url && anonKey);

let _client = null;

export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}
