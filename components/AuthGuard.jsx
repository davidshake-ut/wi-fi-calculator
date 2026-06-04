'use client';

import { useState } from 'react';
import { Wifi, Loader2 } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { getSupabase } from '@/lib/supabase/client';
import { Card, Button, TextInput, Field } from '@/components/ui/primitives';

function Centered({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm p-6">{children}</Card>
    </div>
  );
}

function LoginScreen() {
  const supabase = getSupabase();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <Centered>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
          <Wifi size={18} />
        </span>
        <h1 className="text-sm font-semibold text-slate-800">Managed Wi-Fi BOM Calculator</h1>
      </div>
      {sent ? (
        <p className="text-sm text-slate-600">
          Check <strong>{email}</strong> for a magic sign-in link.
        </p>
      ) : (
        <form onSubmit={signIn} className="space-y-3">
          <Field label="Work Email">
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send Magic Link'}
          </Button>
          <p className="text-center text-xs text-slate-400">Access is invite-only.</p>
        </form>
      )}
    </Centered>
  );
}

export default function AuthGuard({ children, requireSuperAdmin = false }) {
  const { configured, loading, session, error, isSuperAdmin, signOut } = useSession();

  // Local mode — no backend configured. Calculator is fully usable.
  if (!configured) return children;

  if (loading) {
    return (
      <Centered>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="animate-spin" size={18} /> Loading…
        </div>
      </Centered>
    );
  }

  if (!session) return <LoginScreen />;

  if (error === 'company_not_recognized') {
    return (
      <Centered>
        <h2 className="mb-2 text-base font-semibold text-slate-800">Company Not Recognized</h2>
        <p className="text-sm text-slate-600">
          Your email domain isn’t linked to a company. Contact an administrator.
        </p>
        <Button variant="outline" className="mt-4 w-full" onClick={signOut}>
          Sign out
        </Button>
      </Centered>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <Centered>
        <h2 className="mb-2 text-base font-semibold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-600">This page is restricted to super administrators.</p>
      </Centered>
    );
  }

  return children;
}
