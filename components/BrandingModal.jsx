'use client';

import { useEffect, useState } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { Card, Button, Field, TextInput } from '@/components/ui/primitives';

const MAX_LOGO_BYTES = 1_000_000; // ~1 MB — localStorage-friendly

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

export default function BrandingModal({ branding, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...branding }));
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file (PNG, JPG, SVG…).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      if (dataUrl.length > MAX_LOGO_BYTES * 1.37) {
        setErr('That logo is too large — keep it under ~1 MB (try a smaller PNG/JPG).');
        return;
      }
      const img = new Image();
      img.onload = () => {
        set('logo', { dataUrl, w: img.naturalWidth || 200, h: img.naturalHeight || 80 });
        setErr(null);
      };
      img.onerror = () => setErr('Could not read that image.');
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onClose}
    >
      <Card
        className="w-full max-w-md p-5"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Branding</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Company Name">
            <TextInput
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Acme Networks"
            />
          </Field>

          <Field label="Logo" sub="Shown in the app header and on the PDF (keep under ~1 MB)">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                {form.logo?.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logo.dataUrl}
                    alt="Logo preview"
                    className="max-h-12 max-w-[6.5rem] object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                </label>
                {form.logo && (
                  <button
                    type="button"
                    onClick={() => set('logo', null)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary Color">
              <ColorInput value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
            </Field>
            <Field label="Accent Color">
              <ColorInput value={form.accentColor} onChange={(v) => set('accentColor', v)} />
            </Field>
          </div>

          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(form)}>
            Save Branding
          </Button>
        </div>
      </Card>
    </div>
  );
}
