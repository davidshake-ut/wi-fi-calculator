'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Layers, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

function PhasePreview({ phase }) {
  const [open, setOpen] = useState(false);
  const totalDays = phase.tasks.reduce((s, t) => s + Number(t.duration_days ?? 1), 0);
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {open ? <ChevronDown size={14} className="shrink-0 text-slate-400" /> : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
        <span className="flex-1 text-sm font-medium text-slate-700">{phase.name}</span>
        <span className="text-xs text-slate-400">{phase.tasks.length} tasks · {totalDays}d</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pb-2 pt-1 space-y-1.5">
          {phase.tasks.map((task, i) => (
            <div key={i} className="rounded-md bg-white p-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">{task.name}</span>
                <span className="ml-auto flex items-center gap-1 text-slate-400">
                  <Clock size={11} /> {task.duration_days}d
                </span>
                {task.role && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <User size={11} /> {task.role}
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-1 text-slate-500 leading-relaxed">{task.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplyTemplateModal({ open, technology, templates, projectStartDate, onApply, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const techTemplates = templates.filter((t) => t.technology === technology);
  const selected = techTemplates.find((t) => t.id === selectedId);
  const totalDays = selected
    ? selected.phases.reduce((s, ph) => s + ph.tasks.reduce((ts, tk) => ts + Number(tk.duration_days ?? 1), 0), 0)
    : 0;

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    setError(null);
    try {
      await onApply(selected);
      onClose();
    } catch (err) {
      setError(err?.message ?? 'Failed to apply template.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Apply Template</h2>
            <p className="mt-0.5 text-xs text-slate-500">{technology}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Template list */}
          <div className="w-52 shrink-0 overflow-y-auto border-r border-slate-100 p-3 space-y-1">
            {techTemplates.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No templates for<br />{technology} yet.</p>
            ) : (
              techTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selectedId === t.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <div className="font-medium">{t.name}</div>
                  {t.isSystem && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Layers size={10} /> System template
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Preview pane */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Select a template to preview
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{selected.name}</p>
                  {selected.description && (
                    <p className="mt-1 text-xs text-slate-500">{selected.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{selected.phases.length} phases</span>
                    <span>{selected.phases.reduce((s, p) => s + p.tasks.length, 0)} tasks</span>
                    <span>~{totalDays} working days</span>
                    {projectStartDate && (
                      <span>
                        Est. complete:{' '}
                        {addBusinessDaysDisplay(new Date(projectStartDate), totalDays)}
                      </span>
                    )}
                  </div>
                </div>
                {selected.phases.map((phase, i) => (
                  <PhasePreview key={i} phase={phase} />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-6 py-4 space-y-3">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!selected || applying} onClick={handleApply}>
            {applying ? 'Applying…' : 'Apply Template'}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function addBusinessDaysDisplay(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
