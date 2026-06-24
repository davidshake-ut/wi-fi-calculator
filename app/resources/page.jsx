'use client';

import { useState } from 'react';
import { Plus, Search, FileText, Video, Link2, BookOpen, Layers, Trash2, ExternalLink } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { useSession } from '@/components/SessionProvider';
import { useResources } from '@/hooks/useResources';
import AddResourceModal from '@/components/resources/AddResourceModal';
import { Card, Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  guide:    BookOpen,
  doc:      FileText,
  video:    Video,
  template: Layers,
  link:     Link2,
};

const TYPE_COLORS = {
  guide:    'bg-blue-50 text-blue-600',
  doc:      'bg-slate-100 text-slate-600',
  video:    'bg-violet-50 text-violet-600',
  template: 'bg-emerald-50 text-emerald-600',
  link:     'bg-amber-50 text-amber-600',
};

const TYPE_LABELS = { guide: 'Guide', doc: 'Doc', video: 'Video', template: 'Template', link: 'Link' };

function ResourcesContent() {
  const { session, company, user } = useSession();
  const { resources, loading, createResource, deleteResource } = useResources(session, company, user);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const categories = ['All', ...Array.from(new Set(resources.map((r) => r.category).filter(Boolean))).sort()];

  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || r.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = async (r) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    setDeleting(r.id);
    try { await deleteResource(r.id); } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Resources</h1>
          <p className="mt-1 text-sm text-slate-500">Knowledge base, guides, datasheets, and tools</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Resource</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides, datasheets, videos…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      </div>

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                catFilter === cat
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >{cat}</button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading resources…</p>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">{search ? 'No resources match your search' : 'No resources yet'}</p>
          {!search && <Button size="sm" className="mt-4" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Resource</Button>}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.type] ?? FileText;
            return (
              <Card key={r.id} className="group relative flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TYPE_COLORS[r.type] ?? TYPE_COLORS.doc)}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{r.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{TYPE_LABELS[r.type] ?? r.type} · {r.category}</p>
                  </div>
                </div>

                {r.description && <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>}

                <div className="flex items-center justify-between mt-auto pt-1">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      <ExternalLink size={12} /> Open
                    </a>
                  ) : <span />}
                  <button onClick={() => handleDelete(r)} disabled={deleting === r.id}
                    className="rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddResourceModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={createResource} />
    </div>
  );
}

export default function ResourcesPage() {
  return <AuthGuard><OSShell><ResourcesContent /></OSShell></AuthGuard>;
}
