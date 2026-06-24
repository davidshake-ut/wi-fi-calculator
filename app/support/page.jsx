'use client';

import { Plus, AlertCircle, CheckCircle2, Clock, Tag } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { Card, Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const PLACEHOLDER_TICKETS = [
  { id: 'TKT-001', title: 'Wi-Fi drops intermittently in Building B', customer: 'Acme Hotels', priority: 'High',   status: 'Open',        age: '2h' },
  { id: 'TKT-002', title: 'Camera offline — Entrance Gate 3',         customer: 'Metro LLC',   priority: 'Medium', status: 'In Progress', age: '1d' },
  { id: 'TKT-003', title: 'Slow speeds reported in Room 204–208',     customer: 'Sunrise Corp',priority: 'Low',    status: 'Open',        age: '3d' },
];

const PRIORITY_STYLES = {
  High:   'bg-red-50 text-red-600',
  Medium: 'bg-amber-50 text-amber-600',
  Low:    'bg-slate-100 text-slate-500',
};

const STATUS_ICONS = {
  Open:        AlertCircle,
  'In Progress': Clock,
  Resolved:    CheckCircle2,
};

function SupportContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customer Support</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ticket management — track, triage, and resolve customer issues
          </p>
        </div>
        <Button size="sm" disabled title="Coming soon">
          <Plus size={14} /> New Ticket
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: '—', color: 'text-red-600' },
          { label: 'In Progress', value: '—', color: 'text-amber-600' },
          { label: 'Resolved Today', value: '—', color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      {/* Ticket list */}
      <Card className="divide-y divide-slate-100">
        {PLACEHOLDER_TICKETS.map((t) => {
          const StatusIcon = STATUS_ICONS[t.status] || AlertCircle;
          return (
            <div key={t.id} className="flex items-start gap-4 p-4 opacity-50">
              <StatusIcon size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-xs text-slate-400">{t.customer} · {t.age} ago</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_STYLES[t.priority])}>
                  {t.priority}
                </span>
                <span className="text-xs text-slate-400">{t.id}</span>
              </div>
            </div>
          );
        })}
      </Card>

      <Card className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Tag size={22} className="text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Support module coming soon</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
          Full ticket management with alerts, SLA tracking, and a shareable portal for support partners.
        </p>
      </Card>
    </div>
  );
}

export default function SupportPage() {
  return (
    <AuthGuard>
      <OSShell>
        <SupportContent />
      </OSShell>
    </AuthGuard>
  );
}
