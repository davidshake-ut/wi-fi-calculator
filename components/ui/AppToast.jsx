'use client';

import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-sm',
        isError
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      )}
    >
      {isError
        ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
        : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />}
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}
