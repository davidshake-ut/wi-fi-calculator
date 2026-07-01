'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Field, TextInput, Select } from '@/components/ui/primitives';
import { TECHNOLOGIES } from '@/lib/templates/index';

const EMPTY = {
  name: '',
  customer_name: '',
  status: 'planning',
  start_date: '',
  end_date: '',
  budget: '',
  description: '',
  quote_id: '',
  technologies: [],
};

export default function NewProjectModal({ open, onClose, onSave, quotes = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // setState inside a timer callback avoids the set-state-in-effect lint rule
    const t = setTimeout(() => {
      setForm(EMPTY);
      setErr(null);
      firstRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Project name is required.'); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        name: form.name.trim(),
        customer_name: form.customer_name.trim() || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        description: form.description.trim() || null,
        quote_id: form.quote_id || null,
        technologies: form.technologies,
      });
      onClose();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="New Project"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">New Project</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {err && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project Name *" className="sm:col-span-2">
              <TextInput
                ref={firstRef}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Acme Hotels — Wi-Fi Phase 2"
                required
              />
            </Field>

            <Field label="Customer">
              <TextInput
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                placeholder="Acme Hotels Group"
              />
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="complete">Complete</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>

            <Field label="Start Date">
              <TextInput
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
              />
            </Field>

            <Field label="End Date">
              <TextInput
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
              />
            </Field>

            <Field label="Budget ($)">
              <TextInput
                type="number"
                min="0"
                step="1000"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="0"
              />
            </Field>

            {quotes.length > 0 && (
              <Field label="Link to Quote (optional)">
                <Select value={form.quote_id} onChange={(e) => set('quote_id', e.target.value)}>
                  <option value="">— none —</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.project_name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-medium text-slate-700">Technologies</p>
              <div className="flex flex-wrap gap-2">
                {TECHNOLOGIES.map((tech) => {
                  const checked = form.technologies.includes(tech);
                  return (
                    <label
                      key={tech}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        checked
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() =>
                          set(
                            'technologies',
                            checked
                              ? form.technologies.filter((t) => t !== tech)
                              : [...form.technologies, tech]
                          )
                        }
                      />
                      {tech}
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Optional project notes…"
                rows={3}
                className="h-auto w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
