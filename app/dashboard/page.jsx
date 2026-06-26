'use client';

import {
  TrendingUp, Users, FolderKanban, DollarSign, Clock, AlertCircle,
  FileText, Layers,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { useSession } from '@/components/SessionProvider';
import { Card } from '@/components/ui/primitives';
import { useCRMAccounts } from '@/hooks/useCRMAccounts';
import { usePSAProjects } from '@/hooks/usePSAProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useProjects } from '@/hooks/useProjects';
import { useResources } from '@/hooks/useResources';

function fmtMoney(n) {
  if (!n) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function KpiCard({ label, icon: Icon, value, sub, loading }) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">
          {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-100" /> : value}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
      </div>
    </Card>
  );
}

function DashboardContent() {
  const { session, company, user } = useSession();

  const { accounts,  loading: loadingCrm      } = useCRMAccounts(session, company, user);
  const { projects: psaProjects, loading: loadingPsa } = usePSAProjects(session, company, user);
  const { invoices,  loading: loadingInv      } = useInvoices(session, company, user);
  const { tickets,   loading: loadingTickets  } = useSupportTickets(session, company, user);
  const { projects: savedProjects, } = useProjects(session, company, user);
  const { resources, loading: loadingResources } = useResources(session, company, user);

  const activeProjects = psaProjects.filter(
    (p) => p.status === 'planning' || p.status === 'active',
  ).length;

  const revenueCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total || 0), 0);

  const openTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  ).length;

  const categoryCount = new Set(
    resources.filter((r) => r.category).map((r) => r.category),
  ).size;

  const kpis = [
    {
      label: 'Total Customers',
      icon: Users,
      value: accounts.length,
      sub: 'CRM accounts',
      loading: loadingCrm,
    },
    {
      label: 'Active Projects',
      icon: FolderKanban,
      value: activeProjects,
      sub: 'Planning + active',
      loading: loadingPsa,
    },
    {
      label: 'Revenue Collected',
      icon: DollarSign,
      value: fmtMoney(revenueCollected),
      sub: 'All paid invoices',
      loading: loadingInv,
    },
    {
      label: 'Open Tickets',
      icon: AlertCircle,
      value: openTickets,
      sub: 'Open + in progress',
      loading: loadingTickets,
    },
    {
      label: 'Builder Proposals',
      icon: TrendingUp,
      value: savedProjects.length,
      sub: 'Saved quotes',
      loading: false,
    },
    {
      label: 'Avg. Response Time',
      icon: Clock,
      value: '—',
      sub: 'Coming soon',
      loading: false,
    },
    {
      label: 'Documents',
      icon: FileText,
      value: resources.length,
      sub: 'Resources uploaded',
      loading: loadingResources,
    },
    {
      label: 'Resource Groups',
      icon: Layers,
      value: categoryCount,
      sub: 'Unique categories',
      loading: loadingResources,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time KPIs and business metrics across all FSG OS modules.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
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
