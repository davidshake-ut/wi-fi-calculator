'use client';

import { TrendingUp, Users, FolderKanban, DollarSign, Clock, AlertCircle } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { Card } from '@/components/ui/primitives';

const KPI_CARDS = [
  { label: 'Total Customers',   icon: Users,       value: '—', sub: 'CRM module' },
  { label: 'Active Projects',   icon: FolderKanban,value: '—', sub: 'Projects module' },
  { label: 'Revenue MTD',       icon: DollarSign,  value: '—', sub: 'Financials coming soon' },
  { label: 'Open Tickets',      icon: AlertCircle, value: '—', sub: 'Support module' },
  { label: 'Quotes This Month', icon: TrendingUp,  value: '—', sub: 'System Builder' },
  { label: 'Avg. Response Time',icon: Clock,       value: '—', sub: 'Support module' },
];

function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time KPIs and business metrics — data will populate as modules are activated.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map(({ label, icon: Icon, value, sub }) => (
          <Card key={label} className="flex items-start gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent Activity</h2>
        <div className="space-y-3">
          {['Project Management', 'CRM', 'Customer Support'].map((mod) => (
            <div key={mod} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{mod}</span> — activity feed coming soon
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <OSShell>
        <DashboardContent />
      </OSShell>
    </AuthGuard>
  );
}
