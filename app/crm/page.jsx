'use client';

import { Search, UserPlus, Phone, Mail, Building2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { Card, Button } from '@/components/ui/primitives';

const PLACEHOLDER_CONTACTS = [
  { name: 'Acme Hotels Group',     type: 'Hospitality',    contacts: 3, status: 'Active' },
  { name: 'Sunrise Senior Living', type: 'Senior Living',  contacts: 2, status: 'Active' },
  { name: 'Metro Apartments LLC',  type: 'Multi-Family',   contacts: 1, status: 'Prospect' },
];

function CRMContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">CRM</h1>
          <p className="mt-1 text-sm text-slate-500">Customer and contact management</p>
        </div>
        <Button size="sm" disabled title="Coming soon">
          <UserPlus size={14} /> Add Customer
        </Button>
      </div>

      {/* Search bar placeholder */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          disabled
          placeholder="Search customers, contacts, opportunities…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-400 shadow-sm outline-none"
        />
      </div>

      {/* Placeholder account cards */}
      <div className="space-y-3">
        {PLACEHOLDER_CONTACTS.map((c) => (
          <Card key={c.name} className="flex items-center gap-4 p-4 opacity-50">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Building2 size={18} className="text-slate-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
              <p className="text-xs text-slate-400">{c.type} · {c.contacts} contact{c.contacts !== 1 ? 's' : ''}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {c.status}
            </span>
          </Card>
        ))}
      </div>

      <Card className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Building2 size={22} className="text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">CRM module coming soon</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
          Track customers, contacts, opportunities, and proposals. Linked to quotes from System Builder.
        </p>
        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Building2 size={12} /> Accounts</span>
          <span className="flex items-center gap-1"><Phone size={12} /> Contacts</span>
          <span className="flex items-center gap-1"><Mail size={12} /> Opportunities</span>
        </div>
      </Card>
    </div>
  );
}

export default function CRMPage() {
  return (
    <AuthGuard>
      <OSShell>
        <CRMContent />
      </OSShell>
    </AuthGuard>
  );
}
