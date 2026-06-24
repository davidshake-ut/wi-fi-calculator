'use client';

import { Plus, Calendar, DollarSign, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { Card, Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const STATUS_COLUMNS = [
  {
    id: 'planning',
    label: 'Planning',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: Circle,
    projects: [
      { name: 'Sunrise Senior Living — Phase 2', customer: 'Sunrise Corp', budget: '$142,000', due: 'Q3 2026' },
    ],
  },
  {
    id: 'active',
    label: 'Active',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: AlertCircle,
    projects: [
      { name: 'Metro Apartments Wi-Fi Upgrade', customer: 'Metro LLC', budget: '$88,500', due: 'Jul 2026' },
      { name: 'Acme Hotels — Camera Systems', customer: 'Acme Hotels', budget: '$215,000', due: 'Aug 2026' },
    ],
  },
  {
    id: 'complete',
    label: 'Complete',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: CheckCircle2,
    projects: [],
  },
];

function ProjectsContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            PSA — plan, track, and deliver projects linked to your System Builder quotes
          </p>
        </div>
        <Button size="sm" disabled title="Coming soon">
          <Plus size={14} /> New Project
        </Button>
      </div>

      {/* Kanban columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUS_COLUMNS.map(({ id, label, color, bg, icon: Icon, projects }) => (
          <div key={id} className="space-y-3">
            <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', bg)}>
              <Icon size={14} className={color} />
              <span className={cn('text-xs font-semibold uppercase tracking-wide', color)}>
                {label}
              </span>
              <span className={cn('ml-auto text-xs font-medium', color)}>{projects.length}</span>
            </div>

            {projects.map((p) => (
              <Card key={p.name} className="p-4 opacity-60 space-y-2">
                <p className="text-sm font-medium text-slate-800 leading-snug">{p.name}</p>
                <p className="text-xs text-slate-400">{p.customer}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><DollarSign size={11} />{p.budget}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} />{p.due}</span>
                </div>
              </Card>
            ))}

            {projects.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-400">No {label.toLowerCase()} projects</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Card className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Clock size={22} className="text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Project Management coming soon</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
          Full PSA capabilities — milestones, tasks, time tracking, budget vs. actuals, and resource scheduling.
          Projects link directly to System Builder quotes.
        </p>
      </Card>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <OSShell>
        <ProjectsContent />
      </OSShell>
    </AuthGuard>
  );
}
