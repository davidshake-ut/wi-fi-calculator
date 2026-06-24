'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Phone, Globe, MapPin, FileText, Loader2, AlertCircle, Pencil, Check, X } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { useSession } from '@/components/SessionProvider';
import { useCRMAccount } from '@/hooks/useCRMAccount';
import ContactSection from '@/components/crm/ContactSection';
import { Select, Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  prospect: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

const TYPE_LABELS = {
  hospitality: 'Hospitality', senior_living: 'Senior Living',
  multi_family: 'Multi-Family', education: 'Education',
  healthcare: 'Healthcare', other: 'Other',
};

const TABS = [{ id: 'contacts', label: 'Contacts' }, { id: 'overview', label: 'Overview' }];

function EditableField({ label, value, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const commit = async () => {
    const v = draft.trim() || null;
    if (v !== (value ?? null)) await onSave(v);
    setEditing(false);
  };
  if (editing) {
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
        <div className="flex items-center gap-1">
          <input autoFocus type={type} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-blue-400 px-2 py-1 text-sm outline-none ring-2 ring-blue-500/20" />
          <button onClick={commit} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-slate-400">{label}</p>
      <button onClick={() => { setDraft(value ?? ''); setEditing(true); }}
        className="group flex items-center gap-1 text-sm text-slate-700 hover:text-blue-600">
        {value || <span className="text-slate-300 italic">—</span>}
        <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

function AccountDetail() {
  const { id } = useParams();
  const { session } = useSession();
  const { account, contacts, loading, updateAccount, createContact, deleteContact } = useCRMAccount(id, session);
  const [tab, setTab] = useState('contacts');

  if (loading) {
    return <div className="flex h-64 items-center justify-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>;
  }
  if (!account) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <AlertCircle size={28} className="text-slate-300" />
        <p className="text-sm">Account not found.</p>
        <Link href="/crm" className="text-sm text-blue-600 hover:underline">← Back to CRM</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/crm" className="mb-3 flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600">
          <ArrowLeft size={13} /> CRM
        </Link>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Building2 size={20} className="text-slate-500" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900">{account.name}</h1>
            <p className="text-xs text-slate-500">{TYPE_LABELS[account.type] ?? account.type}</p>
          </div>
          <Select className="h-8 w-32 text-xs" value={account.status}
            onChange={(e) => updateAccount({ status: e.target.value })}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="mt-4 flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                tab === t.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {tab === 'contacts' && (
          <ContactSection contacts={contacts} onAdd={createContact} onDelete={deleteContact} />
        )}
        {tab === 'overview' && (
          <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <EditableField label="Phone" value={account.phone} onSave={(v) => updateAccount({ phone: v })} type="tel" placeholder="(555) 000-0000" />
            <EditableField label="Website" value={account.website} onSave={(v) => updateAccount({ website: v })} type="url" placeholder="https://…" />
            <EditableField label="Address" value={account.address} onSave={(v) => updateAccount({ address: v })} placeholder="123 Main St…" />
            <div>
              <p className="mb-0.5 text-xs font-medium text-slate-400">Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{account.notes || <span className="italic text-slate-300">—</span>}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRMAccountPage() {
  return <AuthGuard><OSShell><AccountDetail /></OSShell></AuthGuard>;
}
