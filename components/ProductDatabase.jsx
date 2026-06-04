'use client';

import { useMemo, useState } from 'react';
import { Pencil, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Card, Button, Badge, TextInput } from '@/components/ui/primitives';
import { CORE_SKUS } from '@/lib/catalog';
import { currency } from '@/lib/format';

export default function ProductDatabase({
  allProducts,
  priceOverrides,
  setPriceOverrides,
  onAdd, // Phase D
  onEdit, // Phase D
  onDelete, // Phase D
  canManageCatalog = false,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const effective = (p, field) => priceOverrides[p.sku]?.[field] ?? p[field];

  const setOverride = (p, field, value) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [p.sku]: {
        cost: prev[p.sku]?.cost ?? p.cost,
        price: prev[p.sku]?.price ?? p.price,
        [field]: value,
      },
    }));
  };

  const resetOne = (sku) =>
    setPriceOverrides((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <TextInput
            className="h-9 w-64 pl-8"
            placeholder="Search SKU, description, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={Object.keys(priceOverrides).length === 0}
            onClick={() => setPriceOverrides({})}
          >
            Reset All Prices
          </Button>
          {canManageCatalog && (
            <Button size="sm" onClick={onAdd}>
              Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const overridden = Boolean(priceOverrides[p.sku]);
              return (
                <tr
                  key={p.sku}
                  className={`border-b border-slate-50 last:border-0 ${overridden ? 'bg-orange-50/60' : ''}`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">
                    {p.sku}
                    {p.isCustom && (
                      <Badge className="ml-1 border-purple-200 bg-purple-50 text-purple-600">custom</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{p.desc}</td>
                  <td className="px-4 py-2">
                    <Badge className="border-slate-200 bg-slate-50 text-slate-500">{p.category}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      className="h-7 w-24 rounded border border-slate-300 px-2 text-right text-xs tabular-nums text-slate-700"
                      value={effective(p, 'cost')}
                      onChange={(e) => setOverride(p, 'cost', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      className="h-7 w-24 rounded border border-slate-300 px-2 text-right text-xs tabular-nums text-slate-700"
                      value={effective(p, 'price')}
                      onChange={(e) => setOverride(p, 'price', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {overridden && (
                        <button
                          title="Reset price override"
                          onClick={() => resetOne(p.sku)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                      {canManageCatalog && (
                        <>
                          <button
                            title="Edit product"
                            onClick={() => onEdit?.(p)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            title={
                              CORE_SKUS.has(p.sku)
                                ? 'Core product — cannot be deleted'
                                : 'Delete product'
                            }
                            onClick={() => onDelete?.(p)}
                            disabled={CORE_SKUS.has(p.sku)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Cost/price edits here are <strong>per-project</strong> overrides saved with the project.
        Catalog Add/Edit/Delete (company-admin+) writes to the global product database.
      </p>
    </Card>
  );
}
