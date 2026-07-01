'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Field, TextInput, Select } from '@/components/ui/primitives';

const EMPTY = { title: '', description: '', type: 'doc', category: '', url: '' };

const CATEGORIES = ['Wi-Fi', 'Camera', 'Training', 'Sales', 'General'];

export default function AddResourceModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { setForm(EMPTY); setErr(null); firstRef.current?.focus(); }, 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    setSaving(true); setErr(null);
    try {
      await onSave({
        title:       form.title.trim(),
        description: form.description.trim() || null,
        type:        form.type,
        category:    form.category.trim() || 'General',
        url:         form.url.trim() || null,
      });
      onClose();
    } catch (ex) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Add Resource"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Add Resource</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {err && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *" className="sm:col-span-2">
              <TextInput ref={firstRef} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Wi-Fi Site Survey Best Practices" required />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="guide">Guide</option>
                <option value="doc">Document</option>
                <option value="video">Video</option>
                <option value="template">Template</option>
                <option value="link">Link</option>
              </Select>
            </Field>
            <Field label="Category">
              <input
                list="category-options"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="Wi-Fi, Camera, Training…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <datalist id="category-options">
                {CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="URL" className="sm:col-span-2">
              <TextInput type="url" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
                placeholder="Brief description of this resource…"
                className="h-auto w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Resource'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
