'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, Button, Field, TextInput, NumberInput, Select } from '@/components/ui/primitives';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

const EMPTY = { sku: '', description: '', category: 'Access Point', cost: 0, price: 0 };

// product === null → Add mode; otherwise Edit (SKU locked for base products).
function initialForm(product) {
  if (!product) return EMPTY;
  return {
    sku: product.sku,
    description: product.desc ?? product.description ?? '',
    category: product.category,
    cost: product.cost,
    price: product.price,
  };
}

// The modal is mounted only while open (see page.jsx), so initializing form
// state from `product` here resets it correctly each time it opens — no effect.
export default function ProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState(() => initialForm(product));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const isEdit = Boolean(product);
  const skuLocked = isEdit && !product.isCustom; // base products keep their SKU
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSave(form);
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <Card className="w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="SKU">
            <TextInput value={form.sku} onChange={(e) => set('sku', e.target.value)} disabled={skuLocked} required />
          </Field>
          <Field label="Description">
            <TextInput value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost">
              <NumberInput value={form.cost} onChange={(v) => set('cost', v)} />
            </Field>
            <Field label="Price">
              <NumberInput value={form.price} onChange={(v) => set('price', v)} />
            </Field>
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
