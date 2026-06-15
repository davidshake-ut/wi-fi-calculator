'use client';

import { Card } from '@/components/ui/primitives';
import { currency, percent, marginColor } from '@/lib/format';

// Editable professional-labor rate card. Each row is a worker level with an
// internal cost rate, a client bill rate, and estimated hours; the line totals
// and subtotal update live. This is the project's ONLY labor — it replaced the
// old auto-generated services. Cost/margin columns appear with "Show Cost &
// Margin" (mirrors the BOM/Services tables).
export default function LaborTable({ roles, setRoles, showMargin }) {
  const setField = (key, field, value) =>
    setRoles((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const num = (v) => Math.max(0, Number(v) || 0);

  const rows = roles.map((r) => {
    const hours = num(r.hours);
    const costRate = num(r.costRate);
    const billRate = num(r.billRate);
    const lineCost = costRate * hours;
    const linePrice = billRate * hours;
    return {
      ...r,
      lineCost,
      linePrice,
      margin: linePrice > 0 ? ((linePrice - lineCost) / linePrice) * 100 : 0,
    };
  });

  const totalHours = rows.reduce((s, r) => s + num(r.hours), 0);
  const totalCost = rows.reduce((s, r) => s + r.lineCost, 0);
  const totalPrice = rows.reduce((s, r) => s + r.linePrice, 0);

  const cell =
    'h-7 w-20 rounded border border-slate-300 px-2 text-right text-xs tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">Professional Labor</h3>
        <p className="text-xs text-slate-400">
          Hourly rate card by worker level — drives all labor on this quote.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">Worker Level</th>
              {showMargin && <th className="px-4 py-2 text-right font-medium">Cost/hr</th>}
              <th className="px-4 py-2 text-right font-medium">Bill/hr</th>
              <th className="px-4 py-2 text-right font-medium">Hours</th>
              {showMargin && <th className="px-4 py-2 text-right font-medium">Cost</th>}
              <th className="px-4 py-2 text-right font-medium">Price</th>
              {showMargin && <th className="px-4 py-2 text-right font-medium">Margin</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 text-slate-700">{r.label}</td>
                {showMargin && (
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={cell}
                      value={r.costRate}
                      onChange={(e) => setField(r.key, 'costRate', Number(e.target.value))}
                    />
                  </td>
                )}
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={cell}
                    value={r.billRate}
                    onChange={(e) => setField(r.key, 'billRate', Number(e.target.value))}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={cell}
                    value={r.hours}
                    onChange={(e) => setField(r.key, 'hours', Number(e.target.value))}
                  />
                </td>
                {showMargin && (
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                    {currency(r.lineCost)}
                  </td>
                )}
                <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-700">
                  {currency(r.linePrice)}
                </td>
                {showMargin && (
                  <td className="px-4 py-2 text-right">
                    <span className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${marginColor(r.margin)}`}>
                      {percent(r.margin, 0)}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-semibold">
              <td className="px-4 py-2.5 text-slate-700">
                Labor Subtotal
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({totalHours} hr{totalHours === 1 ? '' : 's'})
                </span>
              </td>
              {showMargin && <td />}
              <td />
              <td />
              {showMargin && (
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {currency(totalCost)}
                </td>
              )}
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                {currency(totalPrice)}
              </td>
              {showMargin && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
