'use client';

import { Search, FileText, Video, Link2, BookOpen, Wifi, Camera } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { Card, Button } from '@/components/ui/primitives';

const PLACEHOLDER_RESOURCES = [
  { title: 'Wi-Fi Site Survey Best Practices',  type: 'Guide',  category: 'Wi-Fi',   icon: Wifi },
  { title: 'Camera Placement & Coverage Guide', type: 'Guide',  category: 'Camera',  icon: Camera },
  { title: 'Cambium XV2-21X Datasheet',         type: 'Doc',    category: 'Wi-Fi',   icon: FileText },
  { title: 'Hospitality Network Design 101',    type: 'Video',  category: 'Training',icon: Video },
  { title: 'Uniview NVR Configuration Guide',   type: 'Doc',    category: 'Camera',  icon: FileText },
  { title: 'Proposal Template — Senior Living', type: 'Template',category: 'Sales',  icon: Link2 },
];

function ResourcesContent() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Resources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Knowledge base, guides, datasheets, and tools for your team
          </p>
        </div>
        <Button size="sm" disabled title="Coming soon">
          Add Resource
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          disabled
          placeholder="Search guides, datasheets, videos…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-400 shadow-sm outline-none"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Wi-Fi', 'Camera', 'Training', 'Sales'].map((cat) => (
          <button
            key={cat}
            disabled
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 opacity-60"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_RESOURCES.map(({ title, type, category, icon: Icon }) => (
          <Card key={title} className="flex items-start gap-3 p-4 opacity-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Icon size={16} className="text-slate-500" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 leading-snug truncate">{title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{type} · {category}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <BookOpen size={22} className="text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Resources module coming soon</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
          Centralized knowledge base for guides, datasheets, templates, and training materials — searchable and categorized for your team.
        </p>
      </Card>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <AuthGuard>
      <OSShell>
        <ResourcesContent />
      </OSShell>
    </AuthGuard>
  );
}
