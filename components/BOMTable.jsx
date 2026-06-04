'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/primitives';
import { CATEGORY_ORDER } from '@/lib/catalog';
import { currency, percent, marginColor } from '@/lib/format';

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  const ordered = [];
  for (const cat of CATEGORY_ORDER) {
    if (groups.has(cat)) ordered.push([cat, groups.get(cat)]);
  }
  // Any category not in CATEGORY_ORDER, appended at the end.
  for (const [cat, rows] of groups) {
    if (!CATEGORY_ORDER.includes(cat)) ordered.push([cat, rows]);
  }
  return ordered;
}

// One single table for the whole BOM (rather than a table per category) so all
// columns share one auto-layout: numeric/SKU cells never wrap (whitespace-nowrap)
// and the flexible Description column absorbs the slack — columns line up across
// every category and nothing rolls onto a second line while space exists.
export default function BOMTable({ bom, showMargin, setShowMargin }) {
  const groups = groupByCategory(bom.items);
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggle = (cat) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const colCount = showMargin ? 8 : 5;
  const th = 'px-4 py-2.5 font-medium';
  const thNum = `${th} text-right whitespace-nowrap`;
  const td = 'px-4 py-2 whitespace-nowrap';
  const tdNum = `${td} text-right tabular-nums`;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowMargin((s) => !s)}>
          {showMargin ? 'Hide Cost & Margin' : 'Show Cost & Margin'}
        </Button>
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

            {groups.map(([cat, rows]) => {
              const subtotal = rows.reduce((s, r) => s + r.totalPrice, 0);
              const open = !collapsed.has(cat);
              return (
                <tbody key={cat}>
                  <tr
                    className="cursor-pointer border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                    onClick={() => toggle(cat)}
                  >
                    <td colSpan={colCount} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {cat}
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
                    rows.map((r, i) => (
                      <tr
                        key={`${r.sku}-${i}`}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className={`${td} font-mono text-xs text-slate-500`}>{r.sku}</td>
                        <td className="min-w-[14rem] px-4 py-2 text-slate-700">
                          {r.description}
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
