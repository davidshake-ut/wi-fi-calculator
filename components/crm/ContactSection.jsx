'use client';

import { useState } from 'react';
import { Plus, Trash2, Mail, Phone, User } from 'lucide-react';
import { Button, Field, TextInput } from '@/components/ui/primitives';

function ContactForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', title: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim()  || null,
        email:      form.email.trim()      || null,
        phone:      form.phone.trim()      || null,
        title:      form.title.trim()      || null,
      });
      onCancel();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-600">New Contact</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First Name *">
          <TextInput autoFocus value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Jane" required />
        </Field>
        <Field label="Last Name">
          <TextInput value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Smith" />
        </Field>
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="IT Director" />
        </Field>
        <Field label="Phone">
          <TextInput type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button size="sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Contact'}</Button>
      </div>
    </form>
  );
}

export default function ContactSection({ contacts, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !adding && (
        <p className="py-6 text-center text-sm text-slate-400">No contacts yet.</p>
      )}

      {contacts.map((c) => (
        <div key={c.id} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <User size={15} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {c.first_name}{c.last_name ? ` ${c.last_name}` : ''}
            </p>
            {c.title && <p className="text-xs text-slate-500">{c.title}</p>}
            <div className="mt-1 flex flex-wrap gap-3">
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Mail size={11} /> {c.email}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  <Phone size={11} /> {c.phone}
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(c.id)}
            className="shrink-0 rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {adding
        ? <ContactForm onSave={onAdd} onCancel={() => setAdding(false)} />
        : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Plus size={13} /> Add contact
          </button>
        )
      }
    </div>
  );
}
