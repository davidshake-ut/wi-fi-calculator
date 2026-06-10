'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card, Button, Badge, TextInput } from '@/components/ui/primitives';
import { CORE_SKUS, CATEGORY_ORDER } from '@/lib/catalog';
import { parseCatalogCSV } from '@/lib/csv';
import { exportCatalogCSV } from '@/lib/exportCSV';
import { currency } from '@/lib/format';

export default function ProductDatabase({
  allProducts,
  priceOverrides,
  setPriceOverrides,
  onAdd, // Phase D
  onEdit, // Phase D
  onDelete, // Phase D
  onImport,
  canManageCatalog = false,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState(null); // 'sku' | 'desc' | 'category'
  const [sortDir, setSortDir] = useState('asc');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { products, errors } = parseCatalogCSV(text);
      if (products.length === 0) {
        alert(`No products imported.\n\n${errors.join('\n') || 'No valid rows found.'}`);
        return;
      }
      const res = await onImport(products);
      const summary = `Imported ${products.length} row(s): ${res.added} added, ${res.updated} updated.`;
      alert(
        errors.length
          ? `${summary}\n\nSkipped ${errors.length} row(s):\n${errors.join('\n')}`
          : summary
      );
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Categories present, in CATEGORY_ORDER (for the filter dropdown).
  const categories = useMemo(() => {
    const present = [...new Set(allProducts.map((p) => p.category))];
    return present.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [allProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allProducts;
    if (q) {
      list = list.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1;
      const val = (p) => (sortKey === 'desc' ? p.desc : p[sortKey]) || '';
      list = [...list].sort(
        (a, b) => dir * val(a).localeCompare(val(b), undefined, { numeric: true, sensitivity: 'base' })
      );
    }
    return list;
  }, [allProducts, search, categoryFilter, sortKey, sortDir]);

  const sortHeader = (key, label, align = 'left') => (
    <th className={`px-4 py-2 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-600"
      >
        {label}
        {sortKey === key ? (
          sortDir === 'asc' ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="text-slate-300" />
        )}
      </button>
    </th>
  );

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <TextInput
              className="h-9 w-60 pl-8"
              placeholder="Search SKU, description, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={Object.keys(priceOverrides).length === 0}
            onClick={() => setPriceOverrides({})}
          >
            Reset All Prices
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCatalogCSV(allProducts)}>
            <Download size={14} /> Export CSV
          </Button>
          {canManageCatalog && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={14} /> {importing ? 'Importing…' : 'Import CSV'}
              </Button>
              <Button size="sm" onClick={onAdd}>
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              {sortHeader('sku', 'SKU')}
              {sortHeader('desc', 'Description')}
              {sortHeader('category', 'Category')}
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No products match the current search/filter.
                </td>
              </tr>
            )}
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
        Catalog Add/Edit/Delete writes to the product database.{' '}
        <strong>Import CSV</strong> adds/updates products using the{' '}
        <strong>Export CSV</strong> template columns: SKU, Description, Category, Cost, Price.
      </p>
    </Card>
  );
}
