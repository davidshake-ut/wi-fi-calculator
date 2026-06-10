'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/primitives';
import { CATEGORY_ORDER } from '@/lib/catalog';
import { SEGMENT_ORDER, segmentOf } from '@/lib/segments';
import { currency, percent, marginColor } from '@/lib/format';
import { cn } from '@/lib/utils';

const SORTS = [
  { id: 'category', label: 'Category' },
  { id: 'priceDesc', label: 'Price: High → Low' },
  { id: 'priceAsc', label: 'Price: Low → High' },
  { id: 'name', label: 'Name: A → Z' },
];

function sortItems(items, sortBy) {
  const arr = [...items];
  if (sortBy === 'priceDesc') return arr.sort((a, b) => b.totalPrice - a.totalPrice);
  if (sortBy === 'priceAsc') return arr.sort((a, b) => a.totalPrice - b.totalPrice);
  if (sortBy === 'name') return arr.sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  // category (default): by CATEGORY_ORDER then description
  return arr.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    const c = (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
    if (c !== 0) return c;
    return (a.description || '').localeCompare(b.description || '');
  });
}

function groupBySegment(items) {
  const map = new Map();
  for (const item of items) {
    const seg = segmentOf(item.category);
    if (!map.has(seg)) map.set(seg, []);
    map.get(seg).push(item);
  }
  const ordered = [];
  for (const seg of SEGMENT_ORDER) if (map.has(seg)) ordered.push([seg, map.get(seg)]);
  for (const [seg, rows] of map) if (!SEGMENT_ORDER.includes(seg)) ordered.push([seg, rows]);
  return ordered;
}

export default function BOMTable({ bom, showMargin, setShowMargin }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());
  const [sortBy, setSortBy] = useState('category');

  const groups = useMemo(() => groupBySegment(bom.items), [bom.items]);
  const segmentsPresent = useMemo(() => groups.map(([seg]) => seg), [groups]);

  const toggleCollapse = (seg) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(seg) ? next.delete(seg) : next.add(seg);
      return next;
    });

  const toggleHidden = (seg) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(seg) ? next.delete(seg) : next.add(seg);
      return next;
    });

  const visibleGroups = groups.filter(([seg]) => !hidden.has(seg));

  const colCount = showMargin ? 8 : 5;
  const th = 'px-4 py-2.5 font-medium';
  const thNum = `${th} text-right whitespace-nowrap`;
  const td = 'px-4 py-2 whitespace-nowrap';
  const tdNum = `${td} text-right tabular-nums`;

  return (
    <div className="space-y-3">
      {/* Filter + sort toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {segmentsPresent.map((seg) => {
            const active = !hidden.has(seg);
            return (
              <button
                key={seg}
                type="button"
                onClick={() => toggleHidden(seg)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-400 line-through'
                )}
              >
                {seg}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => setShowMargin((s) => !s)}>
            {showMargin ? 'Hide Cost & Margin' : 'Show Cost & Margin'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className={th}>SKU</th>
                <th className={th}>Description</th>
                <th className={thNum}>Qty</th>
                {showMargin && <th className={thNum}>Unit Cost</th>}
                <th className={thNum}>Unit Price</th>
                {showMargin && <th className={thNum}>Total Cost</th>}
                <th className={thNum}>Total Price</th>
                {showMargin && <th className={thNum}>Margin</th>}
              </tr>
            </thead>

            {visibleGroups.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-sm text-slate-400">
                    No items — all segments are filtered out.
                  </td>
                </tr>
              </tbody>
            )}

            {visibleGroups.map(([seg, rows]) => {
              const subtotal = rows.reduce((s, r) => s + r.totalPrice, 0);
              const open = !collapsed.has(seg);
              const sorted = sortItems(rows, sortBy);
              return (
                <tbody key={seg}>
                  <tr
                    className="cursor-pointer border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                    onClick={() => toggleCollapse(seg)}
                  >
                    <td colSpan={colCount} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {seg}
                          <Badge className="border-slate-200 bg-white text-slate-500">
                            {rows.length}
                          </Badge>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-slate-700">
                          {currency(subtotal)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {open &&
                    sorted.map((r, i) => (
                      <tr
                        key={`${r.sku}-${i}`}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className={`${td} font-mono text-xs text-slate-500`}>{r.sku}</td>
                        <td className="min-w-[14rem] px-4 py-2 text-slate-700">
                          <span className="inline-flex items-center gap-2">
                            <span>{r.description}</span>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              {r.category}
                            </span>
                          </span>
                          {r.note && (
                            <span className="block text-xs italic text-slate-400">{r.note}</span>
                          )}
                        </td>
                        <td className={`${tdNum} text-slate-700`}>{r.qty}</td>
                        {showMargin && (
                          <td className={`${tdNum} text-slate-500`}>{currency(r.unitCost)}</td>
                        )}
                        <td className={`${tdNum} text-slate-700`}>{currency(r.unitPrice)}</td>
                        {showMargin && (
                          <td className={`${tdNum} text-slate-500`}>{currency(r.totalCost)}</td>
                        )}
                        <td className={`${tdNum} font-medium text-slate-700`}>
                          {currency(r.totalPrice)}
                        </td>
                        {showMargin && (
                          <td className={`${td} text-right`}>
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${marginColor(r.margin)}`}
                            >
                              {percent(r.margin, 0)}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </Card>
    </div>
  );
}
